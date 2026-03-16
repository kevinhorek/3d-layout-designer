import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import type { FurnitureTemplate, FurnitureItem } from '../data/venueData'

interface FurniturePanelProps {
  templates: FurnitureTemplate[]
  selectedTemplate: FurnitureTemplate | null
  onSelect: (template: FurnitureTemplate) => void
  furniture: FurnitureItem[]
  onDelete: (id: string) => void
  onRotate: (id: string) => void
}

export default function FurniturePanel({ templates, selectedTemplate, onSelect, furniture, onDelete, onRotate }: FurniturePanelProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Furniture</Text>
      <View style={styles.grid}>
        {templates.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => onSelect(t)}
            style={[styles.card, selectedTemplate?.id === t.id && styles.cardActive]}
          >
            <Text style={styles.icon}>{t.icon}</Text>
            <Text style={[styles.name, selectedTemplate?.id === t.id && styles.nameActive]} numberOfLines={1}>{t.name}</Text>
            <Text style={[styles.dims, selectedTemplate?.id === t.id && styles.dimsActive]}>{t.dimensions.width}×{t.dimensions.depth}m</Text>
          </TouchableOpacity>
        ))}
      </View>

      {furniture.length > 0 && (
        <>
          <Text style={[styles.heading, { marginTop: 20 }]}>Placed ({furniture.length})</Text>
          {furniture.map((item) => {
            const tmpl = templates.find(t => item.id.startsWith(t.id + '-'))
            return (
              <View key={item.id} style={styles.placedRow}>
                <Text style={styles.placedName} numberOfLines={1}>{tmpl?.name ?? 'Item'}</Text>
                <View style={styles.placedActions}>
                  <TouchableOpacity onPress={() => onRotate(item.id)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>↻</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.actionBtn, styles.deleteBtn]}>
                    <Text style={styles.actionText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 12 },
  heading: { fontSize: 16, fontWeight: '700', color: '#003366', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: '47%',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cardActive: {
    backgroundColor: '#003366',
    borderColor: '#FFC72C',
    borderWidth: 2,
  },
  icon: { fontSize: 24, marginBottom: 4 },
  name: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center' },
  nameActive: { color: '#fff' },
  dims: { fontSize: 10, color: '#666', marginTop: 2 },
  dimsActive: { color: 'rgba(255,255,255,0.8)' },
  placedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 6,
  },
  placedName: { fontSize: 13, color: '#333', flex: 1 },
  placedActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { backgroundColor: '#003366', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  deleteBtn: { backgroundColor: '#c53030' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
