import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BarChart2, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { MOCK_BUDGET_DATA } from '../constants';
import { analyzeBudgetQuery } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const BudgetAnalysis: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello Councilman. I have loaded the FY2024 budget data for District 30. How can I assist you? You can ask about cost overruns, specific departments, or project statuses."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for filtering the table based on card clicks
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Dynamic Statistics Calculations
  const totalAmount = MOCK_BUDGET_DATA.reduce((sum, item) => sum + item.cost, 0);
  const activeCount = MOCK_BUDGET_DATA.filter(item => item.status === 'In Progress').length;
  const overBudgetCount = MOCK_BUDGET_DATA.filter(item => item.status === 'Over Budget').length;

  // Filter Data Logic
  const filteredData = filterStatus
    ? MOCK_BUDGET_DATA.filter(item => item.status === filterStatus)
    : MOCK_BUDGET_DATA;

  const handleCardClick = (status: string | null) => {
    // If clicking the active filter, toggle it off (reset to null)
    if (filterStatus === status && status !== null) {
      setFilterStatus(null);
    } else {
      setFilterStatus(status);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const responseText = await analyzeBudgetQuery(MOCK_BUDGET_DATA, userMsg.content);
      const aiMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: responseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: "I'm sorry, I encountered an error analyzing the data." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Data Visualization Panel */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Budget Overview: District 30</h1>
                <p className="text-slate-500 mt-2">Fiscal Year 2024 • Q3 Report</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Allocated Card - Resets Filter */}
                <div 
                  onClick={() => handleCardClick(null)}
                  className={`bg-white p-6 rounded-xl shadow-sm border transition-all cursor-pointer hover:shadow-md ${
                    filterStatus === null 
                      ? 'border-blue-500 ring-1 ring-blue-500' 
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                    <div className="text-sm text-slate-500 font-medium mb-1">Total Allocated</div>
                    <div className="text-2xl font-bold text-slate-900">
                      ${(totalAmount / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-green-600 mt-2 flex items-center">
                        <BarChart2 className="w-3 h-3 mr-1"/> All Departments
                    </div>
                </div>

                {/* Active Projects Card - Filters for 'In Progress' */}
                <div 
                  onClick={() => handleCardClick('In Progress')}
                  className={`bg-white p-6 rounded-xl shadow-sm border transition-all cursor-pointer hover:shadow-md ${
                    filterStatus === 'In Progress' 
                      ? 'border-emerald-500 ring-1 ring-emerald-500' 
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-sm text-slate-500 font-medium mb-1">Active Projects</div>
                            <div className="text-2xl font-bold text-slate-900">{activeCount}</div>
                        </div>
                        <Clock className={`w-5 h-5 ${filterStatus === 'In Progress' ? 'text-emerald-500' : 'text-slate-300'}`} />
                    </div>
                    <div className="text-xs text-slate-400 mt-2">Currently in progress</div>
                </div>

                {/* Over Budget Card - Filters for 'Over Budget' */}
                <div 
                  onClick={() => handleCardClick('Over Budget')}
                  className={`bg-white p-6 rounded-xl shadow-sm border transition-all cursor-pointer hover:shadow-md ${
                    filterStatus === 'Over Budget' 
                      ? 'border-red-500 ring-1 ring-red-500' 
                      : 'border-slate-200 hover:border-red-300'
                  }`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-sm text-slate-500 font-medium mb-1">Over Budget</div>
                            <div className="text-2xl font-bold text-red-600">{overBudgetCount}</div>
                        </div>
                        <AlertCircle className={`w-5 h-5 ${filterStatus === 'Over Budget' ? 'text-red-500' : 'text-slate-300'}`} />
                    </div>
                    <div className="text-xs text-red-500 mt-2">Requires immediate attention</div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">
                      {filterStatus ? `${filterStatus} Projects` : 'All Expenditure Items'}
                    </h3>
                    {filterStatus && (
                      <button 
                        onClick={() => setFilterStatus(null)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Show All
                      </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">Project</th>
                                <th className="px-6 py-3">Dept</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                              filteredData.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.project}</td>
                                    <td className="px-6 py-4 text-slate-500">{item.department}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                                            item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            item.status === 'Over Budget' ? 'bg-red-100 text-red-700' :
                                            item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {item.status === 'Completed' && <CheckCircle2 size={10} />}
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        ${item.cost.toLocaleString()}
                                    </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                                  No projects found with status "{filterStatus}".
                                </td>
                              </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-800">Budget Assistant</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] ${
                        msg.role === 'user' 
                         ? 'bg-slate-800 text-white rounded-tr-none' 
                         : 'bg-slate-100 text-slate-800 rounded-tl-none prose prose-sm prose-slate'
                    }`}>
                        {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-500">
                        Analyzing financial data...
                    </div>
                 </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about the budget..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm shadow-sm"
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={!query.trim() || isLoading}
                    className="absolute right-2 top-2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};