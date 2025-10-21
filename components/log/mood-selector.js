"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { MOOD_TAGS } from "@/lib/data"
import { cn } from "@/lib/utils"

export default function MoodSelector({ selectedMoods = [], onMoodChange }) {
  const [customMood, setCustomMood] = useState("")

  const handleMoodToggle = (moodId) => {
    const newMoods = selectedMoods.includes(moodId)
      ? selectedMoods.filter(id => id !== moodId)
      : [...selectedMoods, moodId]
    onMoodChange(newMoods)
  }

  const handleCustomMoodAdd = () => {
    if (customMood.trim() && !selectedMoods.includes(customMood.trim())) {
      onMoodChange([...selectedMoods, customMood.trim()])
      setCustomMood("")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Heart className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-600">心情</span>
      </div>
      
      {/* 预设心情标签 */}
      <div className="flex flex-wrap gap-2">
        {MOOD_TAGS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => handleMoodToggle(mood.id)}
            className={cn(
              "flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-colors",
              selectedMoods.includes(mood.id)
                ? "bg-gray-200 text-gray-800"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            )}
          >
            <span>{mood.emoji}</span>
            <span>{mood.name}</span>
          </button>
        ))}
      </div>

      {/* 已选择的心情 */}
      {selectedMoods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMoods.map((moodId) => {
            const mood = MOOD_TAGS.find(m => m.id === moodId)
            return (
              <span
                key={moodId}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-800"
              >
                {mood ? mood.emoji : "😊"} {mood ? mood.name : moodId}
                <button
                  onClick={() => handleMoodToggle(moodId)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
