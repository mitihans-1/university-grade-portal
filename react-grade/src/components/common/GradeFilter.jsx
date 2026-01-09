import React from 'react';

const GradeFilter = ({ filters, onFilterChange, availableSemesters = [], availableYears = [] }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '15px',
      flexWrap: 'wrap',
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px'
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
          Search Course
        </label>
        <input
          type="text"
          placeholder="Search by course name or code..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px'
          }}
        />
      </div>

      {availableSemesters.length > 0 && (
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
            Semester
          </label>
          <select
            value={filters.semester || ''}
            onChange={(e) => onFilterChange({ ...filters, semester: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            <option value="">All Semesters</option>
            {availableSemesters.map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>
      )}

      {availableYears.length > 0 && (
        <div style={{ minWidth: '120px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
            Year
          </label>
          <select
            value={filters.year || ''}
            onChange={(e) => onFilterChange({ ...filters, year: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            <option value="">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ minWidth: '120px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
          Grade
        </label>
        <select
          value={filters.grade || ''}
          onChange={(e) => onFilterChange({ ...filters, grade: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px'
          }}
        >
          <option value="">All Grades</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="F">F</option>
        </select>
      </div>

      {(filters.search || filters.semester || filters.year || filters.grade) && (
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={() => onFilterChange({ search: '', semester: '', year: '', grade: '' })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default GradeFilter;

