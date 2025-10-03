'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { MedicalForceService } from '@/lib/dataTypes'
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Filter, 
  Search, 
  TrendingUp,
  Activity,
  Package,
  Scissors,
  Heart
} from 'lucide-react'

export default function ServicesAnalysis() {
  const { state } = useDashboard()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'updated_at' | 'duration'>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const services: MedicalForceService[] = state.data.services || []

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    // Sort services
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
          break
        case 'duration':
          aValue = a.duration_minutes
          bValue = b.duration_minutes
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [services, searchTerm, categoryFilter, sortBy, sortOrder])

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(services.map(service => service.category)))
    return uniqueCategories
  }, [services])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalServices = services.length
    const activeServices = services.filter(s => s.is_active).length
    const avgPrice = services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0
    const avgDuration = services.length > 0 ? services.reduce((sum, s) => sum + s.duration_minutes, 0) / services.length : 0
    
    return {
      totalServices,
      activeServices,
      avgPrice: Math.round(avgPrice),
      avgDuration: Math.round(avgDuration)
    }
  }, [services])

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case '美容':
        return <Heart className="w-4 h-4 text-pink-500" />
      case '外科':
        return <Scissors className="w-4 h-4 text-red-500" />
      case '皮膚科':
        return <Activity className="w-4 h-4 text-blue-500" />
      case '脱毛':
        return <TrendingUp className="w-4 h-4 text-purple-500" />
      case '物販':
        return <Package className="w-4 h-4 text-green-500" />
      default:
        return <Package className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`
  }

  if (services.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="py-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">役務データがありません</h3>
          <p className="text-gray-500">指定された期間に更新された役務が見つかりませんでした。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">総役務数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalServices}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">アクティブ</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeServices}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">平均価格</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.avgPrice)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">平均時間</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.avgDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="役務名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべてのカテゴリ</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated_at">更新日</option>
              <option value="name">名前</option>
              <option value="price">価格</option>
              <option value="duration">時間</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">役務一覧</h3>
          <p className="text-sm text-gray-500">{filteredServices.length}件の役務が見つかりました</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  役務名
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  カテゴリ
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  価格
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  時間
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  更新日
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-gray-500">{service.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getCategoryIcon(service.category)}
                      <span className="ml-2 text-sm text-gray-900">{service.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {formatPrice(service.price)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {formatDuration(service.duration_minutes)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(service.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      service.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.is_active ? 'アクティブ' : '非アクティブ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

