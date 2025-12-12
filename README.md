# InfraVision: From Potholes to Policy with Gemini 🏙️

**InfraVision** is a multimodal AI dashboard that empowers City Council members to instantly triage infrastructure failures, query complex budget data, and visualize urban planning gaps using Google Gemini.

Designed for the **Google Gemini Long Context & Multimodal Competition**, this application bridges the gap between physical city problems (potholes, flooding) and bureaucratic solutions (budgets, department allocation).

---

## 🚀 Key Features

### 1. 📸 Multimodal Incident Triage (Gemini 2.5 Flash)
Citizens or field workers can upload **images** or **video** of infrastructure issues.
*   **Automatic Detection**: Identifies issue type (Flooding, Pothole, Trash, Structural).
*   **Severity Scoring**: Assigns a 1-10 severity rating based on visual evidence.
*   **Cost Estimation**: Estimates repair costs based on NYC infrastructure data.
*   **Department Routing**: Automatically routes the issue to the correct department (Sanitation, Transportation, etc.).

### 2. 🗺️ Precise Geocoding with Grounding (Google Maps Tool)
Uses **Gemini 2.5 Flash** with **Google Maps Grounding** to convert loose address descriptions into precise latitude/longitude coordinates, validating the location against real-world map data before plotting it on the dashboard.

### 3. 🧠 Spatial Urban Planning (Gemini 3 Pro)
Leverages the advanced spatial reasoning of **Gemini 3 Pro** to analyze satellite imagery.
*   **Transportation Deserts**: Visually scans neighborhoods to identify high-density residential areas lacking public transit infrastructure.
*   **Pixel Pointing**: Returns bounding boxes identifying specific zones of concern directly on the image.

### 4. 💰 Conversational Budget Analyst
A chat interface that allows Council members to query budget data using natural language.
*   *Example: "Which projects in District 30 are currently over budget?"*
*   *Example: "How much did we spend on flood mitigation last year?"*

---

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **AI Models**:
    *   `gemini-2.5-flash`: For fast multimodal analysis and tool use (Maps).
    *   `gemini-3-pro-preview`: For complex spatial reasoning and image segmentation.
*   **Mapping**: Leaflet / React-Leaflet
*   **SDK**: `@google/genai`

---

## 🏗️ How to Run

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/infravision.git
    cd infravision
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root directory and add your Google Gemini API Key:
    ```bash
    API_KEY=your_google_ai_studio_api_key_here
    ```
    *Note: Ensure your API key has access to Gemini 2.5 Flash and Gemini 3 Pro.*

4.  **Run the Application**
    ```bash
    npm start
    ```

---

## 🧩 Architecture

### The "Vision-to-Action" Pipeline
1.  **Input**: User uploads a video of a flooded street.
2.  **Preprocessing**: Frontend extracts keyframes to optimize token usage.
3.  **Analysis**: `gemini-2.5-flash` analyzes frames for water depth and safety risk.
4.  **Grounding**: Parallel request to `gemini-2.5-flash` verifies the address via Google Maps.
5.  **Visualization**: Incident is plotted on the map with severity color-coding.
6.  **Context**: User checks the "Budget" tab to see if the "Environmental Protection" department has funds to fix it.

---

## 🏆 Kaggle Competition Notes

This project demonstrates the power of **Gemini's Multimodality** and **Tool Use**:
*   **Video Processing**: We process video inputs by extracting frames client-side, enabling real-time video analysis without heavy backend processing.
*   **Spatial Reasoning**: We utilize Gemini 3's ability to return coordinate bounding boxes (`ymin`, `xmin`, etc.) to overlay UI elements on top of raw satellite images.
*   **Grounding**: We solve the hallucination problem in location data by forcing the model to validate addresses against Google Maps.

---

*Built with ❤️ for better cities.*
