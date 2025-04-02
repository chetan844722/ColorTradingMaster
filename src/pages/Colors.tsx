import React from 'react'

const colors = [
  { id: 1, name: 'Sunset Orange', hex: '#FF7F50', category: 'Warm' },
  { id: 2, name: 'Ocean Blue', hex: '#1E90FF', category: 'Cool' },
  { id: 3, name: 'Forest Green', hex: '#228B22', category: 'Natural' },
  { id: 4, name: 'Royal Purple', hex: '#5D3FD3', category: 'Vibrant' },
  { id: 5, name: 'Coral Pink', hex: '#FF7F7F', category: 'Warm' },
  { id: 6, name: 'Sky Blue', hex: '#87CEEB', category: 'Cool' },
  { id: 7, name: 'Olive Green', hex: '#808000', category: 'Natural' },
  { id: 8, name: 'Electric Indigo', hex: '#4B0082', category: 'Vibrant' },
]

export default function Colors() {
  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Colors</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {colors.map((color) => (
                <div
                  key={color.id}
                  className="overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-md"
                >
                  <div
                    className="h-32 w-full"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900">{color.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{color.hex}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {color.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 