# DataSight Pie Charts: Technical Design

This document provides a technical overview of the two pie chart components in the DataSight application: `ExpertSalesPieChart` and `OntSalesPieChart`.

## 1. Core Technologies

The charts are built using a modern, component-based approach with the following technologies:

-   **React**: The core library for building the user interface. The charts are implemented as functional React components.
-   **Recharts**: A composable charting library built on React components. We use it to render the underlying `PieChart` and its segments.
-   **ShadCN/UI**: Provides the foundational UI components like `Card`, `CardHeader`, and `CardContent`, which act as containers for the charts.
-   **Tailwind CSS**: Used for all styling, including layout, spacing, and typography, ensuring visual consistency with the rest of the application.
-   **TypeScript**: Ensures type safety for all data transformations and component props.

---

## 2. Component Architecture & Data Flow

Both `ExpertSalesPieChart` and `OntSalesPieChart` follow the same architectural pattern.

1.  **Client-Side Rendering**: Both are client components (`'use client'`) that receive the full `parsedData` object from the main page. All data processing and rendering occur in the browser.

2.  **Data Processing with `useMemo`**: The core data transformation logic is wrapped in a `useMemo` hook. This is a critical performance optimization.
    -   The complex data aggregation (calculating sales per expert or per ONT price) is computationally intensive.
    -   `useMemo` caches the result of this computation. The calculation only re-runs if the `parsedData` prop changes, preventing unnecessary processing on every component re-render.

3.  **Dynamic Data Aggregation**:
    -   **Expert Sales Share**: The component iterates through the dataset, finds the relevant columns (`agent`, `fiber sale`, `ont sale`), and aggregates the total revenue for each agent into a JavaScript `Record` (a hash map).
    -   **ONT Sales Share**: Similarly, this component aggregates total revenue based on the unique values found in the `ont sale` column.

4.  **Top N + "Other" Logic**: To ensure the charts remain clean and readable, the aggregated data is processed further:
    -   The data is sorted in descending order based on total sales.
    -   The top four items are taken.
    -   The sales figures for all remaining items are summed up into a single category labeled **"Other"**.
    -   This ensures the chart is not cluttered with dozens of tiny, unreadable slices.

---

## 3. Rendering and Visualization

### Donut Chart Effect

The donut (or ring) chart style is achieved by setting the `innerRadius` prop on the Recharts `<Pie>` component. This creates the empty space in the middle.

```jsx
<Pie
  data={chartData}
  dataKey="totalSales"
  nameKey="name"
  innerRadius={60} // This creates the donut hole
  /* ... */
/>
```

### Color Scheme

-   A predefined array of five distinct `COLORS` is defined within each component. These colors are pulled from the application's CSS theme variables (`hsl(var(--chart-1))`, etc.).
-   During data processing, each of the top four items (and the "Other" category) is assigned a color from this array.
-   The Recharts `<Pie>` component renders each data point using a `<Cell>` component, which receives the assigned `fill` color. This is how each segment gets its unique color.

```jsx
<Pie /* ... */>
  {chartData.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={entry.fill} />
  ))}
</Pie>
```

### Labels and Legends

-   **Percentage Labels**: The percentage value displayed on each pie slice is rendered using the `label` prop on the `<Pie>` component. A simple function calculates the percentage for each segment.
-   **Custom Legend**: The legend displayed beneath the chart is not a built-in Recharts legend. It is a custom list (`<ul>`) rendered by iterating over the `chartData` array. This provides full control over styling and layout, allowing us to match the design specification perfectly with Tailwind CSS.

This component-based and optimized approach results in efficient, maintainable, and visually appealing charts that are fully integrated with the application's design system.
