'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  itemsPerPage: number
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: PaginationProps) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <div className="text-sm text-gray-700">
        {totalItems > 0 && (
          <span>
            {startItem} - {endItem} / {totalItems.toLocaleString()}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 text-sm rounded border ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            )
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-1 text-sm rounded border ${
                currentPage === page
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {page}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 text-sm rounded border ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

