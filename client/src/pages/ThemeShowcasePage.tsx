/**
 * Theme Showcase Page
 * 
 * A page to demonstrate the BlueEarth design system elements
 */

import React from "react";
import { ThemeShowcase } from "@/components/ThemeShowcase";
import { Helmet } from "react-helmet-async";

export function ThemeShowcasePage() {
  return (
    <>
      <Helmet>
        <title>BlueEarth Design System | BlueEarth Portal</title>
        <meta
          name="description"
          content="BlueEarth design system showcase displaying the visual components, colors, typography and spacing used across the application."
        />
      </Helmet>
      <ThemeShowcase />
    </>
  );
}

export default ThemeShowcasePage;