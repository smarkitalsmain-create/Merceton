"use client"

import { StorefrontTheme } from "@/lib/storefront/core/config/schema"
import type { Theme } from "@/lib/storefront/core/theme-schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface ThemeEditorProps {
  theme: StorefrontTheme
  onChange: (theme: StorefrontTheme) => void
}

const fontOptions = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Merriweather",
]

export function ThemeEditor({ theme, onChange }: ThemeEditorProps) {
  const updateColors = (key: keyof Theme["colors"], value: string) => {
    onChange({
      ...theme,
      colors: { ...theme.colors, [key]: value },
    })
  }

  const updateTypography = (key: keyof Theme["typography"], value: string | number) => {
    onChange({
      ...theme,
      typography: { ...theme.typography, [key]: value },
    })
  }

  const updateUI = (key: keyof Theme["ui"], value: string | number) => {
    onChange({
      ...theme,
      ui: { ...theme.ui, [key]: value },
    })
  }

  return (
    <div className="space-y-6">
      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
          <CardDescription>Customize your storefront color palette</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.colors.primary}
                  onChange={(e) => updateColors("primary", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={theme.colors.primary}
                  onChange={(e) => updateColors("primary", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.colors.secondary}
                  onChange={(e) => updateColors("secondary", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={theme.colors.secondary}
                  onChange={(e) => updateColors("secondary", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accent</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.colors.accent}
                  onChange={(e) => updateColors("accent", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={theme.colors.accent}
                  onChange={(e) => updateColors("accent", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Background</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.colors.background}
                  onChange={(e) => updateColors("background", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={theme.colors.background}
                  onChange={(e) => updateColors("background", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Text</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.colors.text}
                  onChange={(e) => updateColors("text", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={theme.colors.text}
                  onChange={(e) => updateColors("text", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Muted</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.colors.muted}
                  onChange={(e) => updateColors("muted", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={theme.colors.muted}
                  onChange={(e) => updateColors("muted", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Border</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.colors.border}
                  onChange={(e) => updateColors("border", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={theme.colors.border}
                  onChange={(e) => updateColors("border", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Choose fonts and font sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Heading Font</Label>
              <Select
                value={theme.typography.headingFont}
                onValueChange={(value) => updateTypography("headingFont", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body Font</Label>
              <Select
                value={theme.typography.bodyFont}
                onValueChange={(value) => updateTypography("bodyFont", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Font Size: {theme.typography.baseFontSize}px</Label>
              <Slider
                value={[theme.typography.baseFontSize]}
                onValueChange={([value]: number[]) => updateTypography("baseFontSize", value)}
                min={12}
                max={24}
                step={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>UI Settings</CardTitle>
          <CardDescription>Customize buttons, spacing, and layout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Border Radius: {theme.ui.borderRadius}px</Label>
              <Slider
                value={[theme.ui.borderRadius]}
                onValueChange={([value]: number[]) => updateUI("borderRadius", value)}
                min={0}
                max={24}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Button Style</Label>
              <Select
                value={theme.ui.buttonStyle}
                onValueChange={(value) => updateUI("buttonStyle", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shadow Intensity</Label>
              <Select
                value={theme.ui.shadowIntensity}
                onValueChange={(value) => updateUI("shadowIntensity", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="strong">Strong</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Spacing Scale</Label>
              <Select
                value={theme.ui.spacingScale}
                onValueChange={(value) => updateUI("spacingScale", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Container Width</Label>
              <Select
                value={theme.ui.containerWidth}
                onValueChange={(value) => updateUI("containerWidth", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boxed">Boxed</SelectItem>
                  <SelectItem value="full">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced CSS */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced CSS</CardTitle>
          <CardDescription>Add custom CSS (scoped to storefront root)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Custom CSS</Label>
            <Textarea
              value={theme.customCss || ""}
              onChange={(e) =>
                onChange({
                  ...theme,
                  customCss: e.target.value || undefined,
                })
              }
              placeholder="#storefront-root { ... }"
              className="font-mono text-sm min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              CSS is automatically scoped to #storefront-root
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
