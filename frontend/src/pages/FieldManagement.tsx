import React, { useState, useEffect } from 'react';
import { PlantIcon, LeafIcon } from '../ui/svgs';

export interface Field {
  id: string;
  name: string;
  size: number; // in acres
  location: string;
  cropType: string;
  plantingDate: Date;
  notes?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

const FieldManagement: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [isAddingField, setIsAddingField] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    location: '',
    cropType: '',
    plantingDate: '',
    notes: '',
    latitude: '',
    longitude: '',
  });

  // Load fields from localStorage on component mount
  useEffect(() => {
    const savedFields = localStorage.getItem('agritech_fields');
    if (savedFields) {
      const parsedFields = JSON.parse(savedFields);
      // Convert date strings back to Date objects
      const fieldsWithDates = parsedFields.map((field: any) => ({
        ...field,
        plantingDate: new Date(field.plantingDate),
      }));
      setFields(fieldsWithDates);
    }
  }, []);

  // Save fields to localStorage whenever fields change
  useEffect(() => {
    if (fields.length > 0) {
      localStorage.setItem('agritech_fields', JSON.stringify(fields));
    }
  }, [fields]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newField: Field = {
      id: Date.now().toString(),
      name: formData.name,
      size: parseFloat(formData.size),
      location: formData.location,
      cropType: formData.cropType,
      plantingDate: new Date(formData.plantingDate),
      notes: formData.notes || undefined,
      coordinates: formData.latitude && formData.longitude ? {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      } : undefined,
    };

    setFields(prev => [...prev, newField]);
    setFormData({
      name: '',
      size: '',
      location: '',
      cropType: '',
      plantingDate: '',
      notes: '',
      latitude: '',
      longitude: '',
    });
    setIsAddingField(false);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    // Update localStorage
    const updatedFields = fields.filter(field => field.id !== fieldId);
    if (updatedFields.length === 0) {
      localStorage.removeItem('agritech_fields');
    } else {
      localStorage.setItem('agritech_fields', JSON.stringify(updatedFields));
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getDaysPlanted = (plantingDate: Date) => {
    const today = new Date();
    const timeDiff = today.getTime() - plantingDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Field Management</h1>
            <p className="text-gray-600 mt-1">Manage your agricultural fields and crop information</p>
          </div>
          <button
            onClick={() => setIsAddingField(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Field
          </button>
        </div>
      </div>

      {/* Add Field Form */}
      {isAddingField && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Add New Field</h2>
            <button
              onClick={() => setIsAddingField(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., North Field, Main Plot"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size (Acres) *</label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 2.5"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Lilongwe, Malawi"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type *</label>
              <select
                name="cropType"
                value={formData.cropType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Crop</option>
                <option value="Maize">Maize</option>
                <option value="Tobacco">Tobacco</option>
                <option value="Groundnuts">Groundnuts</option>
                <option value="Soybean">Soybean</option>
                <option value="Cotton">Cotton</option>
                <option value="Cassava">Cassava</option>
                <option value="Sweet Potato">Sweet Potato</option>
                <option value="Rice">Rice</option>
                <option value="Beans">Beans</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date *</label>
              <input
                type="date"
                name="plantingDate"
                value={formData.plantingDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (Optional)</label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., -13.9626"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (Optional)</label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 33.7741"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Additional information about this field..."
              />
            </div>
            
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Add Field
              </button>
              <button
                type="button"
                onClick={() => setIsAddingField(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fields List */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <PlantIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Fields Added Yet</h3>
            <p className="text-gray-600 mb-4">Add your first field to start managing your crops and get AI recommendations.</p>
            <button
              onClick={() => setIsAddingField(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add Your First Field
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map((field) => (
              <div key={field.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <LeafIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{field.name}</h3>
                      <p className="text-sm text-gray-600">{field.location}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Crop:</span>
                    <span className="text-sm font-medium">{field.cropType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Size:</span>
                    <span className="text-sm font-medium">{field.size} acres</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Planted:</span>
                    <span className="text-sm font-medium">{formatDate(field.plantingDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Days:</span>
                    <span className="text-sm font-medium">{getDaysPlanted(field.plantingDate)} days</span>
                  </div>
                  {field.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{field.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldManagement;
