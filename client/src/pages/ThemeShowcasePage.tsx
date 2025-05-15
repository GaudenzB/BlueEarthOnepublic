/**
 * Theme Showcase Page
 * 
 * A page to demonstrate the BlueEarth design system elements
 * Uses the improved PageLayout component with container and max-width
 */

import React from "react";
import { ThemeShowcase } from "@/components/ThemeShowcase";
import { Helmet } from "react-helmet-async";
import { PageLayout } from "@/components/layouts/PageLayout";

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
      <PageLayout maxWidthClass="max-w-6xl" useGrid>
        <div className="col-span-12">
          <ThemeShowcase />
        </div>
      </PageLayout>
    </>
  );
}

export default ThemeShowcasePage;