# Measurement System Documentation

## Overview

The floorplan app includes a comprehensive measurement system that converts canvas pixels to real-world units, supporting both metric and imperial measurement systems.

## Key Concepts

### Scale Factor (Pixels Per Unit)

The core of the measurement system is the `pixelsPerUnit` setting, which defines how many screen pixels equal one real-world unit (meter or foot).

**Example:**
- `pixelsPerUnit = 10` means 10 pixels on screen = 1 meter (or 1 foot)
- A wall that is 50 pixels long = 5 meters (or 5 feet)
- A wall that is 100 pixels long = 10 meters (or 10 feet)

**Default:** 10 pixels per unit (matches the default grid size for convenience)

### Unit Systems

**Metric System:**
- Primary unit: Meters (m)
- Sub-unit: Centimeters (cm)
- Values < 1m are shown in centimeters
- Example: `0.75 m` or `75 cm`

**Imperial System:**
- Primary unit: Feet (ft)  
- Sub-unit: Inches (in)
- Displayed as feet and inches
- Example: `5' 6"` (5 feet 6 inches)

### Measurement Precision

Controls the number of decimal places displayed:
- `0`: Whole numbers only (`5 m`, `10 ft`)
- `1`: One decimal place (`5.5 m`, `10.5 ft`)
- `2`: Two decimal places (`5.25 m`, `10.25 ft`)
- `3`: Three decimal places (`5.125 m`, `10.125 ft`)

**Default:** 2 decimal places

## Features

### 1. Wall Length Display

When enabled, measurement labels appear at the midpoint of each wall:

- **Visual Design:**
  - Orange text for visibility
  - Semi-transparent black background
  - Rotated to align with wall direction
  - Bold font for readability

- **Auto-Update:**
  - Updates automatically when walls are modified
  - Recalculates when scale or units change
  - Can be toggled on/off

### 2. Scale Independence

Measurements are **zoom-independent** (when zoom/pan is implemented):

- Real-world distances remain constant
- Only the visual representation changes with zoom
- Scale factor accounts for zoom level
- Consistent measurements regardless of view

### 3. Grid Integration

The measurement system integrates with the grid:

- Default scale matches grid size (10px = 1 unit)
- Grid provides visual reference for scale
- Snap-to-grid ensures measurements align to scale
- Easy to estimate distances using grid

## Usage

### Configuring Measurements

**In the Toolbar:**

1. **Show Lengths** checkbox - Toggle measurement labels on/off
2. **Scale** input - Set pixels per unit (1-100)
3. **Units** dropdown - Choose Metric or Imperial
4. **Precision** input - Set decimal places (0-3)

### Reading Measurements

- Wall lengths appear in **orange text** at wall midpoints
- Text rotates to align with wall angle
- Format depends on unit system:
  - Metric: `2.50 m` or `75 cm`
  - Imperial: `8' 2"` or `10'`

### Best Practices

1. **Set Scale First:**
   - Determine your real-world scale before drawing
   - Example: If 1 grid square = 1 meter, use `pixelsPerUnit = 10`

2. **Use Grid for Reference:**
   - Enable snap-to-grid for consistent measurements
   - Grid squares provide visual scale reference

3. **Choose Appropriate Precision:**
   - Architectural plans: 2-3 decimal places
   - Rough sketches: 0-1 decimal places

4. **Unit System Selection:**
   - Use metric for international/scientific work
   - Use imperial for US residential construction

## API Reference

### Utility Functions

```typescript
// Convert pixels to real-world units
pixelsToUnits(pixels: number, pixelsPerUnit: number): number

// Convert real-world units to pixels
unitsToPixels(units: number, pixelsPerUnit: number): number

// Calculate real distance between two points
calculateRealDistance(
  point1: Point,
  point2: Point,
  pixelsPerUnit: number
): number

// Format measurement for display
formatMeasurement(
  value: number,
  unitSystem: UnitSystem,
  precision: number
): string

// Get wall length with formatting
formatWallLength(
  startPoint: Point,
  endPoint: Point,
  settings: MeasurementSettings
): string
```

### State Actions

```typescript
// Toggle measurement display
dispatch({ type: 'SET_SHOW_MEASUREMENTS', show: boolean })

// Set scale factor
dispatch({ type: 'SET_PIXELS_PER_UNIT', value: number })

// Change unit system
dispatch({ type: 'SET_UNIT_SYSTEM', system: 'metric' | 'imperial' })

// Set decimal precision
dispatch({ type: 'SET_MEASUREMENT_PRECISION', precision: number })
```

## Technical Implementation

### Coordinate System

- Canvas uses pixel coordinates (x, y)
- Origin (0, 0) at top-left
- Positive x → right, positive y → down
- Distance calculated using Euclidean formula: √((x₂-x₁)² + (y₂-y₁)²)

### Conversion Formula

```
Real Distance = Pixel Distance / Pixels Per Unit

Example:
- Pixel distance: 50 pixels
- Pixels per unit: 10 px/m
- Real distance: 50 / 10 = 5 meters
```

### Rendering

Measurement labels are rendered using Pixi.js Text objects:

1. Calculate wall midpoint: `((x₁+x₂)/2, (y₁+y₂)/2)`
2. Calculate wall angle: `atan2(y₂-y₁, x₂-x₁)`
3. Create text with formatted measurement
4. Rotate text to align with wall
5. Add semi-transparent background for readability
6. Add to measurement container layer

### Performance

- Measurements recalculated only when walls or settings change
- Text objects destroyed and recreated on updates
- Efficient Map/Set data structures for lookups
- No impact on drawing performance

## Future Enhancements

### Planned Features

1. **Area Calculation:**
   - Calculate room areas automatically
   - Display in m² or ft²
   - Support for irregular shapes

2. **Dimension Lines:**
   - Traditional architectural dimension lines
   - Extension lines and arrows
   - Customizable styles

3. **Measurement Tool:**
   - Interactive tool to measure arbitrary distances
   - Temporary measurement lines
   - Click-and-drag measurement

4. **Scale Ruler:**
   - Visual scale bar on canvas
   - Updates with zoom level
   - Shows current scale ratio

5. **Export with Measurements:**
   - Include measurements in SVG export
   - PDF output with dimensioned drawings
   - CAD format support (DXF)

### Configuration Persistence

Future versions will save measurement settings:

- Store in localStorage
- Include in saved floorplan files
- User preferences across sessions
- Project-specific scale settings

## Examples

### Example 1: Residential Room

**Setup:**
- Grid size: 10px
- Pixels per unit: 10
- Unit system: Metric
- Precision: 2

**Drawing:**
- Grid square = 1 meter
- Draw 4m × 3m room (40px × 30px)
- Walls show: "4.00 m", "3.00 m"

### Example 2: Large Building (Imperial)

**Setup:**
- Grid size: 5px
- Pixels per unit: 5
- Unit system: Imperial
- Precision: 0

**Drawing:**
- Grid square = 1 foot
- Draw 20' × 15' space (100px × 75px)
- Walls show: "20'", "15'"

### Example 3: Detailed Plan (High Precision)

**Setup:**
- Grid size: 20px
- Pixels per unit: 20
- Unit system: Metric
- Precision: 3

**Drawing:**
- Grid square = 1 meter
- Draw 2.5m × 1.75m closet (50px × 35px)
- Walls show: "2.500 m", "1.750 m"

## Troubleshooting

### Issue: Measurements seem wrong

**Solution:**
1. Check `pixelsPerUnit` setting
2. Verify unit system (metric vs imperial)
3. Ensure grid size matches your intended scale
4. Check if snap-to-grid is enabled

### Issue: Text is too small/large

**Solution:**
1. Adjust font size in code (default: 12px)
2. Use zoom feature (when implemented)
3. Adjust precision for shorter/longer numbers

### Issue: Labels overlap

**Solution:**
1. Draw longer walls for more space
2. Reduce precision (fewer digits)
3. Toggle measurements off for cleaner view
4. Use zoom to see details

### Issue: Can't read rotated text

**Solution:**
1. Measurements rotate with walls
2. Vertical/diagonal walls may be harder to read
3. Future update will add smart text rotation
4. Use info panel for exact measurements

## Mathematical Background

### Distance Formula

The distance between two points (x₁, y₁) and (x₂, y₂):

```
d = √((x₂ - x₁)² + (y₂ - y₁)²)
```

This gives us pixel distance, which we convert using:

```
real_distance = pixel_distance / pixels_per_unit
```

### Unit Conversions

**Metric:**
- 1 meter = 100 centimeters
- Display as cm when < 1m

**Imperial:**
- 1 foot = 12 inches
- Split into feet and inches for display
- Example: 5.5 ft = 5' 6"

### Scale Ratios

Traditional architectural scales (future feature):

- 1:50 = 1 unit drawing : 50 units reality
- 1:100 = 1 unit drawing : 100 units reality
- Calculated from pixels per unit and screen DPI

## Conclusion

The measurement system provides accurate, flexible distance calculations for architectural floorplans. It supports multiple unit systems, configurable precision, and automatic label display, making it easy to create professionally dimensioned drawings.
