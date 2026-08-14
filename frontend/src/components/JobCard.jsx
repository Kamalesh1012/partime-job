import React from 'react'

export default function JobCard({job}){
  return (
    <div className="p-4 border rounded shadow-sm bg-white dark:bg-gray-800">
      <h3 className="font-semibold">{job?.title ?? 'Job Title'}</h3>
      <div className="text-sm text-gray-600">{job?.location ?? 'Location'}</div>
      <p className="mt-2 text-sm">{job?.description ?? 'Short description'}</p>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">Apply</button>
        <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Save</button>
      </div>
    </div>
  )
}
