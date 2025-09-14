# DataSight: Technical Overview & System Design

## 1. Executive Summary

DataSight is a web-based data analysis and visualization tool designed for interactive exploration of sales data. Users can upload a CSV file, and the application automatically profiles the data, generates visualizations, and leverages a generative AI model to provide a narrative analysis of trends, patterns, and key insights.

The application is built on a modern, server-centric web architecture, prioritizing performance, type safety, and a high-quality user experience.

## 2. Technology Stack

DataSight is built with a curated set of modern technologies designed for robustness and scalability.

- **Framework**: **Next.js 15** with the App Router. This provides a powerful foundation with Server Components, Server Actions, and a file-system-based router.
- **Language**: **TypeScript**. We use TypeScript throughout the project to ensure type safety and improve developer experience.
- **Frontend**: **React 18**. We leverage React's component-based architecture to build a modular and maintainable user interface.
- **UI Components**: **ShadCN/UI**. A collection of beautifully designed, accessible, and unstyled components that are composed to build the application's UI. This avoids "component library lock-in" by giving us full control over the code.
- **Styling**: **Tailwind CSS**. A utility-first CSS framework used for all styling. The theme is configured in `src/app/globals.css` using CSS variables for easy customization of colors and styles.
- **AI & Backend Logic**: **Genkit**. An open-source framework from Google for building production-ready AI applications. Genkit is used to define the "flow" for analyzing sales data, which calls the Google Gemini model. All Genkit code is co-located within the Next.js application and runs on the server.
- **Data Visualization**: **Recharts**. A composable charting library built on React components, used to create interactive bar charts, scatter plots, and time-series graphs.

## 3. Project Structure

The project follows a standard Next.js App Router structure, with a clear separation of concerns.

```
src/
├── app/
│   ├── page.tsx          # Main application page: file upload UI and dashboard container.
│   ├── layout.tsx        # Root layout for the application.
│   └── globals.css       # Global styles and ShadCN/Tailwind CSS theme variables.
│
├── components/
│   ├── ui/               # Core, reusable UI components from ShadCN (Button, Card, etc.).
│   └── data-sight/       # Application-specific components.
│       ├── dashboard.tsx       # Main dashboard layout, appears after data is loaded.
│       ├── column-profiler.tsx # Displays statistical analysis for each data column.
│       ├── visualizer.tsx      # Contains the charting components (distribution, correlation, time-series).
│       ├── ai-analysis.tsx     # Handles the AI trend analysis generation and display.
│       └── ...                 # Other specific components like SummaryCards and the Logo.
│
├── ai/
│   ├── genkit.ts         # Initializes and configures the global Genkit instance with the Google AI plugin.
│   └── flows/
│       └── analyze-sales-trends.ts # Defines the core AI logic: the prompt, input/output schemas, and the Genkit flow for analysis.
│
└── lib/
    ├── data-utils.ts     # Core data processing logic: parseCSV() and analyzeColumns().
    └── utils.ts          # Utility functions, primarily cn() for merging Tailwind classes.
```

## 4. Core Logic & Data Flow

The application's workflow is triggered by a user uploading a CSV file.

### 4.1. Data Parsing and Profiling (`src/lib/data-utils.ts`)

1.  **Parsing**: The `parseCSV` function takes the raw CSV text. It splits the text into lines, correctly handles headers, and parses each row into a structured JavaScript object. It is designed to be robust against empty columns.
2.  **Analysis**: The `analyzeColumns` function iterates through each column of the parsed data.
    - **Type Detection**: It first detects if a column is `numeric`, `categorical`, or a `date` based on its values.
    - **Statistical Summary**: Based on the detected type, it calculates relevant statistics:
        - **Numeric**: Mean, min, max, count, missing values.
        - **Categorical**: Unique value count, frequencies.
        - **Date**: Earliest and latest dates.
3.  The output of this process is an array of `ColumnAnalysis` objects, which feeds all the data-driven components in the dashboard.

### 4.2. AI Trend Analysis (`src/ai/flows/analyze-sales-trends.ts`)

1.  **Trigger**: The user clicks the "Analyze Sales Trends" button in the `AiAnalysis` component.
2.  **Flow Invocation**: This action calls the `analyzeSalesTrends` server function, passing the raw CSV data.
3.  **Genkit Flow**:
    - The `analyzeSalesTrendsFlow` is executed on the server.
    - It uses a structured prompt defined in `analyzeSalesTrendsPrompt`. This prompt is a template that instructs the **Google Gemini model** on how to behave.
    - **Prompt Engineering**: The prompt is carefully crafted to:
        - Assume the persona of an expert data analyst.
        - **Require the response to be in Persian.**
        - Perform a specific monthly analysis based on the Solar Hijri calendar.
        - Interpret business-specific data points (e.g., "Free" or "Have" values).
        - Structure the output as a professional report suitable for a manager.
    - The raw CSV data is injected directly into the prompt context for the model to analyze.
4.  **Response**: The model generates the analysis as a structured string, which is returned to the frontend and displayed to the user.

### 4.3. Data Visualization (`src/components/data-sight/visualizer.tsx`)

1.  **Interactive Tabs**: The `Visualizer` component uses a tabbed interface to show different chart types: Distribution, Correlation, and Time Series.
2.  **Data Memoization**: The `useMemo` hook is used extensively to transform the raw data into a format suitable for `Recharts`. This is a performance optimization that prevents redundant calculations on every re-render.
3.  **Chart Types**:
    - **Distribution**: For categorical columns, it generates a bar chart of value counts. For numeric columns, it creates a histogram by binning the data, with a slider to control the number of bins.
    - **Correlation**: Creates a scatter plot, allowing the user to select any two numeric columns for the X and Y axes to identify potential relationships.
    - **Time Series**: Creates a line chart, allowing the user to plot a numeric column over a date column.

This report provides a high-level overview of the DataSight application's design and architecture. It highlights the modern, robust, and maintainable approach taken in its development.