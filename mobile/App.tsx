import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, useWindowDimensions, Platform } from 'react-native'
import Scene3DView from './src/components/Scene3D'
import FurniturePanel from './src/components/FurniturePanel'
import BottomToolbar from './src/components/BottomToolbar'
import {
  venues, getDefaultVenue, getDefaultLocation,
  findVenueById, findLocationById, findTemplate,
  furnitureTemplates,
  type Venue, type VenueLocation, type FurnitureItem, type FurnitureTemplate
} from './src/data/venueData'

export default function App() {
  const { width: screenW } = useWindowDimensions()
  const isTablet = screenW >= 768

  const [selectedVenue, setSelectedVenue] = useState<Venue>(() => getDefaultVenue())
  const [selectedLocation, setSelectedLocation] = useState<VenueLocation>(() => getDefaultLocation(getDefaultVenue()))
  const [furniture, setFurniture] = useState<FurnitureItem[]>(() => [...getDefaultLocation(getDefaultVenue()).layout])
  const [selectedTemplate, setSelectedTemplate] = useState<FurnitureTemplate | null>(null)
  const [floorLevelY, setFloorLevelY] = useState(0)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    setFurniture([...selectedLocation.layout])
    setSelectedTemplate(null)
  }, [selectedLocation])

  const handleVenueChange = useCallback((venueId: string) => {
    const venue = findVenueById(venueId)
    if (venue) {
      setSelectedVenue(venue)
      setSelectedLocation(venue.locations[0])
    }
  }, [])

  const handleLocationChange = useCallback((locationId: string) => {
    const location = findLocationById(selectedVenue, locationId)
    if (location) setSelectedLocation(location)
  }, [selectedVenue])

  const handleTemplateSelect = useCallback((template: FurnitureTemplate) => {
    setSelectedTemplate(template)
    const newItem: FurnitureItem = {
      id: `${template.id}-${Date.now()}`,
      type: template.type,
      position: [0, 0, 0],
      rotation: 0,
      scale: 1,
    }
    setFurniture(prev => [...prev, newItem])
  }, [])

  const handleDelete = useCallback((id: string) => {
    setFurniture(prev => prev.filter(item => item.id !== id))
  }, [])

  const handleRotate = useCallback((id: string) => {
    setFurniture(prev => prev.map(item =>
      item.id === id ? { ...item, rotation: (item.rotation + Math.PI / 2) % (Math.PI * 2) } : item
    ))
  }, [])

  const handleClearAll = useCallback(() => setFurniture([]), [])

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#003366" />

      <View style={styles.header}>
        <Text style={styles.title}>3D Layout Designer</Text>
        <View style={styles.headerRight}>
          <View style={styles.venueInfo}>
            <Text style={styles.venueLabel}>{selectedVenue.name}</Text>
            <Text style={styles.locationLabel}>{selectedLocation.name}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowPanel(!showPanel)} style={styles.panelToggle}>
            <Text style={styles.panelToggleText}>{showPanel ? 'Scene' : 'Library'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.venuePickers}>
        <View style={styles.pickerRow}>
          <Text style={styles.pickerLabel}>Venue</Text>
          <View style={styles.pickerChips}>
            {venues.map(v => (
              <TouchableOpacity
                key={v.id}
                onPress={() => handleVenueChange(v.id)}
                style={[styles.chip, selectedVenue.id === v.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedVenue.id === v.id && styles.chipTextActive]}>{v.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.pickerRow}>
          <Text style={styles.pickerLabel}>Location</Text>
          <View style={styles.pickerChips}>
            {selectedVenue.locations.map(l => (
              <TouchableOpacity
                key={l.id}
                onPress={() => handleLocationChange(l.id)}
                style={[styles.chip, selectedLocation.id === l.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedLocation.id === l.id && styles.chipTextActive]}>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.mainArea, isTablet && styles.mainAreaTablet]}>
        {(!showPanel || isTablet) && (
          <View style={[styles.sceneWrap, isTablet && showPanel && { flex: 2 }]}>
            <Scene3DView furniture={furniture} floorLevelY={floorLevelY} findTemplate={findTemplate} />
            {furniture.length === 0 && (
              <View style={styles.emptyOverlay}>
                <Text style={styles.emptyText}>Tap "Library" to add furniture</Text>
              </View>
            )}
          </View>
        )}
        {(showPanel || isTablet) && (
          <View style={[styles.panelWrap, isTablet && { flex: 1 }]}>
            <FurniturePanel
              templates={furnitureTemplates}
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateSelect}
              furniture={furniture}
              onDelete={handleDelete}
              onRotate={handleRotate}
            />
          </View>
        )}
      </View>

      <BottomToolbar
        floorLevelY={floorLevelY}
        onFloorLevelChange={setFloorLevelY}
        roomDimensions={selectedLocation.roomDimensions}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    backgroundColor: '#003366',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 3,
    borderBottomColor: '#FFC72C',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  venueInfo: { alignItems: 'flex-end' },
  venueLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  locationLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  panelToggle: { backgroundColor: '#FFC72C', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  panelToggleText: { color: '#003366', fontWeight: '700', fontSize: 13 },
  clearBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  clearBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  venuePickers: {
    backgroundColor: '#003366',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 6,
  },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, width: 60 },
  pickerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  chipActive: { backgroundColor: '#FFC72C', borderColor: '#FFC72C' },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: '#003366', fontWeight: '700' },

  mainArea: { flex: 1 },
  mainAreaTablet: { flexDirection: 'row' },
  sceneWrap: { flex: 1, backgroundColor: '#222' },
  panelWrap: { flex: 1 },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
