import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import RNCSlider from '@react-native-community/slider'
const Slider = RNCSlider as any

interface BottomToolbarProps {
  floorLevelY: number
  onFloorLevelChange: (value: number) => void
  roomDimensions: { width: number; depth: number }
}

export default function BottomToolbar({ floorLevelY, onFloorLevelChange, roomDimensions }: BottomToolbarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sliderRow}>
        <Text style={styles.label}>Floor level (Y)</Text>
        <Slider
          style={styles.slider}
          minimumValue={-1}
          maximumValue={1}
          step={0.05}
          value={floorLevelY}
          onValueChange={onFloorLevelChange}
          minimumTrackTintColor="#003366"
          maximumTrackTintColor="#ccc"
          thumbTintColor="#FFC72C"
        />
        <Text style={styles.value}>{floorLevelY.toFixed(2)}</Text>
      </View>
      <Text style={styles.roomInfo}>{roomDimensions.width}m × {roomDimensions.depth}m</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: '#003366',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 12, fontWeight: '600', color: '#003366', width: 90 },
  slider: { flex: 1, height: 30 },
  value: { fontSize: 12, color: '#333', width: 40, textAlign: 'right' },
  roomInfo: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'right' },
})
