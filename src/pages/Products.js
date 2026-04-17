import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsRequest } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const dispatch = useDispatch();
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const { products, categories, loading } = useSelector((state) => state.products);
  const searchCategoryId = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';

  const [filters, setFilters] = useState({
    categoryId: categoryId || searchCategoryId,
    search: searchQuery,
    minPrice: '',
    maxPrice: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const queryFilters = {};
    if (filters.categoryId) queryFilters.categoryId = filters.categoryId;
    if (filters.search) queryFilters.search = filters.search;
    if (filters.minPrice) queryFilters.minPrice = filters.minPrice;
    if (filters.maxPrice) queryFilters.maxPrice = filters.maxPrice;

    dispatch(fetchProductsRequest(queryFilters));
  }, [dispatch, filters]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categoryId: categoryId || searchCategoryId,
      search: searchQuery,
    }));
  }, [categoryId, searchCategoryId, searchQuery]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      search: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  const currentCategory = categories.find((c) => c._id === filters.categoryId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="md:w-64 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowFilters((open) => !open)}
            className="mb-4 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 shadow-sm md:hidden"
          >
            <span>Filters</span>
            <svg className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`${showFilters ? 'block' : 'hidden'} md:block bg-white rounded-lg shadow p-4 md:sticky md:top-20`}>
            <h3 className="font-semibold text-lg mb-4">Filters</h3>

            {/* Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search products..."
                className="input-field"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  className="input-field"
                />
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Max"
                  className="input-field"
                />
              </div>
            </div>

            <button onClick={clearFilters} className="w-full btn-secondary text-sm">
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {currentCategory ? currentCategory.name : 'All Products'}
            </h1>
            <p className="text-gray-600">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
              <button onClick={clearFilters} className="mt-4 text-primary-600 hover:text-primary-700">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
