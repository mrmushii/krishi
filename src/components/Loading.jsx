import { memo } from 'react'

const Loading = memo(function Loading() {
  return (
    <div className="flex h-screen items-center justify-center" role="status" aria-busy="true">
      <span className="h-12 w-12 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
    </div>
  )
})

export default Loading
