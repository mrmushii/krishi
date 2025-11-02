import { memo } from 'react'

const Loading = memo(function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-white" role="status" aria-busy="true">
      <span className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-400" />
    </div>
  )
})

export default Loading
