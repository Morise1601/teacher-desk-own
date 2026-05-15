// Mock location data for the "Ultimate UX" flow
export const countries = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'United Arab Emirates' },
];

export const states: Record<string, { code: string, name: string }[]> = {
  IN: [
    { code: 'DL', name: 'Delhi' },
    { code: 'MH', name: 'Maharashtra' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'UP', name: 'Uttar Pradesh' },
  ],
  US: [
    { code: 'CA', name: 'California' },
    { code: 'NY', name: 'New York' },
    { code: 'TX', name: 'Texas' },
    { code: 'FL', name: 'Florida' },
  ],
};

export const cities: Record<string, string[]> = {
  DL: ['New Delhi', 'North Delhi', 'South Delhi'],
  MH: ['Mumbai', 'Pune', 'Nagpur', 'Thane'],
  KA: ['Bangalore', 'Mysore', 'Hubli'],
  TN: ['Chennai', 'Coimbatore', 'Madurai'],
  UP: ['Lucknow', 'Kanpur', 'Noida', 'Graeter Noida'],
  CA: ['Los Angeles', 'San Francisco', 'San Diego'],
  NY: ['New York City', 'Buffalo', 'Rochester'],
};

export const institutions: Record<string, { name: string, type: string, lat: number, lng: number, address: string }[]> = {
  'New Delhi': [
    { name: 'University of Delhi', type: 'University', lat: 28.6892, lng: 77.2144, address: 'Benito Juarez Marg, South Campus, North Delhi' },
    { name: 'Jawaharlal Nehru University', type: 'University', lat: 28.5398, lng: 77.1663, address: 'New Mehrauli Road, JNU Ring Rd, New Delhi' },
    { name: 'IIT Delhi', type: 'College', lat: 28.5450, lng: 77.1926, address: 'IIT Flyover, Hauz Khas, New Delhi' },
    { name: 'Delhi Public School', type: 'School', lat: 28.5910, lng: 77.2285, address: 'Mathura Rd, New Delhi' },
  ],
  'Bangalore': [
    { name: 'Indian Institute of Science (IISc)', type: 'University', lat: 13.0184, lng: 77.5659, address: 'CV Raman Rd, Bangalore' },
    { name: 'RV College of Engineering', type: 'College', lat: 12.9237, lng: 77.4987, address: 'Mysore Rd, RV Vidyaniketan, Bangalore' },
    { name: 'National Public School', type: 'School', lat: 12.9784, lng: 77.6408, address: 'Indiranagar, Bangalore' },
  ],
  'Mumbai': [
    { name: 'University of Mumbai', type: 'University', lat: 18.9272, lng: 72.8336, address: 'MG Road, Fort, Mumbai' },
    { name: 'IIT Bombay', type: 'College', lat: 19.1334, lng: 72.9133, address: 'Powai, Mumbai' },
    { name: 'Jamnabai Narsee School', type: 'School', lat: 19.1114, lng: 72.8271, address: 'Juhu, Mumbai' },
  ],
  'New York City': [
    { name: 'Columbia University', type: 'University', lat: 40.8075, lng: -73.9626, address: '116th St & Broadway, New York, NY 10027' },
    { name: 'New York University (NYU)', type: 'University', lat: 40.7295, lng: -73.9965, address: '70 Washington Square S, New York, NY 10012' },
  ],
};
