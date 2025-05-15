/**
 * ThemeShowcase Component
 * 
 * A showcase component to display the BlueEarth theme elements
 */

import React from "react";
import { BlueEarthCard } from "@/components/ui/BlueEarthCard";
import { BlueEarthButton } from "@/components/ui/BlueEarthButton";
import { themeClass } from "@/lib/theme-utils";
import { blueEarthTheme } from "@/theme/blueearth-theme";

export function ThemeShowcase() {
  return (
    <div className="p-md max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-lg text-center text-primary">
        BlueEarth Design System
      </h1>

      <section className="mb-xl">
        <h2 className="text-2xl font-semibold mb-md">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
          <ColorSwatch name="Primary" color="bg-primary text-primary-foreground" />
          <ColorSwatch name="Secondary" color="bg-secondary text-secondary-foreground" />
          <ColorSwatch name="Accent" color="bg-accent text-accent-foreground" />
          <ColorSwatch name="Muted" color="bg-muted text-muted-foreground" />
          <ColorSwatch name="Background" color="bg-background text-foreground" />
          <ColorSwatch name="Border" color="bg-border text-foreground" />
          <ColorSwatch name="Card" color="bg-card text-card-foreground" />
          <ColorSwatch name="Destructive" color="bg-destructive text-destructive-foreground" />
        </div>
      </section>

      <section className="mb-xl">
        <h2 className="text-2xl font-semibold mb-md">Typography</h2>
        <div className="space-y-sm">
          <div className="text-4xl font-bold">Heading 1 (4xl)</div>
          <div className="text-3xl font-bold">Heading 2 (3xl)</div>
          <div className="text-2xl font-semibold">Heading 3 (2xl)</div>
          <div className="text-xl font-semibold">Heading 4 (xl)</div>
          <div className="text-lg font-medium">Heading 5 (lg)</div>
          <div className="text-base">Base text (base)</div>
          <div className="text-sm">Small text (sm)</div>
          <div className="text-xs">Extra small text (xs)</div>
        </div>
      </section>

      <section className="mb-xl">
        <h2 className="text-2xl font-semibold mb-md">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <BlueEarthCard 
            title="Default Card" 
            description="Standard card variant"
            variant="default"
          >
            <p>This is the content of the default card.</p>
          </BlueEarthCard>
          
          <BlueEarthCard 
            title="Outline Card" 
            description="Card with border emphasis"
            variant="outline"
          >
            <p>This is the content of the outline card.</p>
          </BlueEarthCard>
          
          <BlueEarthCard 
            title="Elevated Card" 
            description="Card with shadow elevation"
            variant="elevated"
            className="md:col-span-2"
          >
            <p>This is the content of the elevated card. It has a shadow that gives it a lifted appearance.</p>
          </BlueEarthCard>
        </div>
      </section>

      <section className="mb-xl">
        <h2 className="text-2xl font-semibold mb-md">Buttons</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="space-y-sm">
            <h3 className="text-lg font-medium mb-xs">Default Variant</h3>
            <div className="flex flex-wrap gap-sm">
              <BlueEarthButton size="sm">Small</BlueEarthButton>
              <BlueEarthButton size="md">Medium</BlueEarthButton>
              <BlueEarthButton size="lg">Large</BlueEarthButton>
            </div>
          </div>
          
          <div className="space-y-sm">
            <h3 className="text-lg font-medium mb-xs">Secondary Variant</h3>
            <div className="flex flex-wrap gap-sm">
              <BlueEarthButton variant="secondary" size="sm">Small</BlueEarthButton>
              <BlueEarthButton variant="secondary" size="md">Medium</BlueEarthButton>
              <BlueEarthButton variant="secondary" size="lg">Large</BlueEarthButton>
            </div>
          </div>
          
          <div className="space-y-sm">
            <h3 className="text-lg font-medium mb-xs">Outline Variant</h3>
            <div className="flex flex-wrap gap-sm">
              <BlueEarthButton variant="outline" size="sm">Small</BlueEarthButton>
              <BlueEarthButton variant="outline" size="md">Medium</BlueEarthButton>
              <BlueEarthButton variant="outline" size="lg">Large</BlueEarthButton>
            </div>
          </div>
          
          <div className="space-y-sm">
            <h3 className="text-lg font-medium mb-xs">Ghost Variant</h3>
            <div className="flex flex-wrap gap-sm">
              <BlueEarthButton variant="ghost" size="sm">Small</BlueEarthButton>
              <BlueEarthButton variant="ghost" size="md">Medium</BlueEarthButton>
              <BlueEarthButton variant="ghost" size="lg">Large</BlueEarthButton>
            </div>
          </div>
          
          <div className="space-y-sm">
            <h3 className="text-lg font-medium mb-xs">Destructive Variant</h3>
            <div className="flex flex-wrap gap-sm">
              <BlueEarthButton variant="destructive" size="sm">Small</BlueEarthButton>
              <BlueEarthButton variant="destructive" size="md">Medium</BlueEarthButton>
              <BlueEarthButton variant="destructive" size="lg">Large</BlueEarthButton>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-xl">
        <h2 className="text-2xl font-semibold mb-md">Spacing</h2>
        <div className="flex flex-wrap gap-md">
          {Object.entries(blueEarthTheme.spacing).map(([key, value]) => (
            <div key={key} className="flex flex-col items-center">
              <div 
                className="bg-primary mb-xs" 
                style={{ width: value, height: value }}
              ></div>
              <div className="text-sm">{key}: {value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-xl">
        <h2 className="text-2xl font-semibold mb-md">Border Radius</h2>
        <div className="flex flex-wrap gap-md">
          {Object.entries(blueEarthTheme.borderRadius).map(([key, value]) => (
            <div key={key} className="flex flex-col items-center">
              <div 
                className="bg-primary mb-xs w-16 h-16" 
                style={{ borderRadius: value }}
              ></div>
              <div className="text-sm">{key}: {value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-xl">
        <h2 className="text-2xl font-semibold mb-md">Shadows</h2>
        <div className="flex flex-wrap gap-lg">
          {Object.entries(blueEarthTheme.shadow).map(([key, value]) => (
            <div key={key} className="flex flex-col items-center">
              <div 
                className="bg-card mb-xs w-24 h-24 border flex items-center justify-center" 
                style={{ boxShadow: value }}
              >
                {key}
              </div>
              <div className="text-sm max-w-[120px] text-center">{key}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

interface ColorSwatchProps {
  name: string;
  color: string;
}

function ColorSwatch({ name, color }: ColorSwatchProps) {
  return (
    <div className="flex flex-col">
      <div 
        className={themeClass("w-full h-16 rounded-md flex items-center justify-center", color)}
      >
        {name}
      </div>
      <div className="text-sm mt-1">{name}</div>
    </div>
  );
}