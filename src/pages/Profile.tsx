import React from 'react'

const userColors = [
  { id: 5, name: 'Coral Pink', hex: '#FF7F7F', category: 'Warm', acquired: '2023-03-15' },
  { id: 6, name: 'Sky Blue', hex: '#87CEEB', category: 'Cool', acquired: '2023-03-20' },
  { id: 7, name: 'Olive Green', hex: '#808000', category: 'Natural', acquired: '2023-04-01' },
  { id: 8, name: 'Electric Indigo', hex: '#4B0082', category: 'Vibrant', acquired: '2023-04-10' },
]

const recentTrades = [
  { id: 1, colorGiven: 'Sunset Orange', colorReceived: 'Coral Pink', date: '2023-03-15' },
  { id: 2, colorGiven: 'Ocean Blue', colorReceived: 'Sky Blue', date: '2023-03-20' },
  { id: 3, colorGiven: 'Forest Green', colorReceived: 'Olive Green', date: '2023-04-01' },
]

export default function Profile() {
  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">My Profile</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* User Info */}
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">User Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account information.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Username</dt>
                  <dd className="mt-1 text-sm text-gray-900">ColorEnthusiast</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">user@example.com</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-sm text-gray-900">March 1, 2023</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Colors Collected</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userColors.length}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* My Colors */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">My Colors</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {userColors.map((color) => (
                <div
                  key={color.id}
                  className="overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-md"
                >
                  <div
                    className="h-24 w-full"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900">{color.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">{color.hex}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {color.category}
                      </span>
                      <span className="text-xs text-gray-500">Acquired: {color.acquired}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trades */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">Recent Trades</h2>
            <div className="mt-4 overflow-hidden bg-white shadow sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {recentTrades.map((trade) => (
                  <li key={trade.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 text-xs">↔</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              Traded {trade.colorGiven} for {trade.colorReceived}
                            </p>
                            <p className="text-sm text-gray-500">{trade.date}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 