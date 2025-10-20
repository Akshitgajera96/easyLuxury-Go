/**
 * Searchable Select Component - Autocomplete dropdown with search
 * Allows users to type and filter options with scrollable results
 */

import React, { useState, useRef, useEffect } from 'react'

const SearchableSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label, 
  icon, 
  required = false 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const dropdownRef = useRef(null)

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [searchTerm, options])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option) => {
    onChange(option)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    if (!isOpen) setIsOpen(true)
  }

  const displayValue = value || ''

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-gray-900 bg-white cursor-pointer"
          required={required}
          autoComplete="off"
        />
        
        {/* Dropdown Arrow Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown List */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-64 overflow-y-auto hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {filteredOptions.length > 0 ? (
              <ul className="py-1">
                {filteredOptions.map((option, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelect(option)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-accent hover:to-accent-dark hover:shadow-xl hover:scale-105 transition-all duration-300 hover:text-white transition-colors ${
                      value === option ? 'bg-accent/10 text-black40 font-semibold' : 'text-gray-900'
                    }`}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-center text-gray-500">
                No cities found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subtle hint text */}
      {!isOpen && !value && (
        <p className="mt-1 text-xs text-gray-500">
          Type to search or click to see all cities
        </p>
      )}
    </div>
  )
}

export default SearchableSelect
