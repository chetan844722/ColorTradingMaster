import React, { useState } from 'react'

const availableColors = [
  { id: 1, name: 'Sunset Orange', hex: '#FF7F50', category: 'Warm' },
  { id: 2, name: 'Ocean Blue', hex: '#1E90FF', category: 'Cool' },
  { id: 3, name: 'Forest Green', hex: '#228B22', category: 'Natural' },
  { id: 4, name: 'Royal Purple', hex: '#5D3FD3', category: 'Vibrant' },
]

const myColors = [
  { id: 5, name: 'Coral Pink', hex: '#FF7F7F', category: 'Warm' },
  { id: 6, name: 'Sky Blue', hex: '#87CEEB', category: 'Cool' },
  { id: 7, name: 'Olive Green', hex: '#808000', category: 'Natural' },
  { id: 8, name: 'Electric Indigo', hex: '#4B0082', category: 'Vibrant' },
]

export default function Trade() {
  const [selectedColor, setSelectedColor] = useState<number | null>(null)
  const [selectedTrade, setSelectedTrade] = useState<number | null>(null)

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Trade Colors</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* My Colors */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">My Colors</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {myColors.map((color) => (
                    <div
                      key={color.id}
                      className={`overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-md ${
                        selectedColor === color.id ? 'ring-2 ring-indigo-500' : ''
                      }`}
                      onClick={() => setSelectedColor(color.id)}
                    >
                      <div
                        className="h-24 w-full"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-900">{color.name}</h3>
                        <p className="mt-1 text-xs text-gray-500">{color.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Colors */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Available Colors</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {availableColors.map((color) => (
                    <div
                      key={color.id}
                      className={`overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-md ${
                        selectedTrade === color.id ? 'ring-2 ring-indigo-500' : ''
                      }`}
                      onClick={() => setSelectedTrade(color.id)}
                    >
                      <div
                        className="h-24 w-full"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-900">{color.name}</h3>
                        <p className="mt-1 text-xs text-gray-500">{color.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trade Button */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                disabled={selectedColor === null || selectedTrade === null}
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${
                  selectedColor !== null && selectedTrade !== null
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Trade Colors
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 