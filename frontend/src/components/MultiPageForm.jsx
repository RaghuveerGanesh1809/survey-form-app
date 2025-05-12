import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MultiPageForm = () => {
  const [kanId, setKanId] = useState('');
  const [formData, setFormData] = useState({
    surveyor: '',
    contact: '',
    location: '',
    gps: '',
    areaType: '',
    elephantFreq: '',
    lastSpotted: '',
    network: {
      airtel: false,
      jio: false,
      bsnl: false,
      vi: false,
      airtelSignal: '',
      jioSignal: '',
      bsnlSignal: '',
      viSignal: '',
    },
    wire: "",
    spikeWire: "",
    treesCamera: "",
    treesLight: "",
    roadAccess: [],         
    defenceMechanism: [],
    suitableSensors: [],         
    suitableVersion: [],  
    uploadedImage: [],     // ✅ add this
    sketchImage: null      // ✅ add this (optional since separate state exists too)
  });
  const [currentPage, setCurrentPage] = useState(1); // Tracks the current form page
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [isSketchSaved, setIsSketchSaved] = useState(false);
  const [uploadedImage, setUploadedImage] = useState([]); // To store uploaded image
  const [sketchImage, setSketchImage] = useState(null); 
  const [isSubmitted, setIsSubmitted] = useState(false);  // Add this line to initialize the state
  const navigate = useNavigate();
  
  
  // Fetch next KAN ID from backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/form/next-kan-id')
      .then(res => setKanId(res.data.kanId))
      .catch(err => console.error("Error fetching KAN ID:", err));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; 
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    console.log("Canvas dimensions:", rect.width, rect.height); 
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);  

  useEffect(() => {
    if (currentPage === 5 && sketchImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = sketchImage;
    }
  }, [currentPage, sketchImage]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
  
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      };
    }
  };
    
  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };
  
  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    console.log("Current Tool: ", tool); // Add this line to check the current tool

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  const stopDrawing = (e) => {
    e?.preventDefault();
    if (!canvasRef.current) return;
    setIsDrawing(false);

    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
  };
  
  const handlePencilClick = () => {
    console.log('Pencil clicked');
    setTool('pencil');  // Set tool to 'pencil'
    
  };

  const handleEraserClick = () => {
    console.log('Eraser clicked');  
    setTool('eraser'); // Set tool to 'pencil'
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Reset tool so cursor reverts to default
    setTool('default'); // or setTool(null)
  };
  
  const saveCanvasImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
  
    // Create a new temporary canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
  
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
  
    // Fill with white background
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  
    // Draw the original canvas content on top
    tempCtx.drawImage(canvas, 0, 0);
  
    // Export as image
    const dataURL = tempCanvas.toDataURL('image/png');
    setSketchImage(dataURL); // Save the final image (with white background)
    alert("Sketch saved!");
  };
  
  // Get GPS from browser
  const handleGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          setFormData(prev => ({ ...prev, gps: coords }));
        },
        () => alert("GPS access denied or unavailable. You can manually enter the coordinates.")
      );
    } else {
      alert("GPS not supported. Please enter coordinates manually.");
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      uploadedImage: prev.uploadedImage.filter((_, i) => i !== index),
      uploadedImageNames: prev.uploadedImageNames.filter((_, i) => i !== index),
    }));
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "roadAccess") {
      setFormData(prev => {
        const updatedRoadAccess = checked
        ? [...prev.roadAccess, value]
        : prev.roadAccess.filter(item => item !== value);
        return { ...prev, roadAccess: updatedRoadAccess };
      });
    } else if (name === "defenceMechanism") {
      setFormData(prev => {
        const updatedDefenceMechanism = checked
        ? [...prev.defenceMechanism, value]
        : prev.defenceMechanism.filter(item => item !== value);
        return { ...prev, defenceMechanism: updatedDefenceMechanism };
      });
    } else if (name === "suitableSensors") {
      setFormData(prev => {
        const updatedSuitableSensors = checked
        ? [...prev.suitableSensors, value]
        : prev.suitableSensors.filter(item => item !== value);
        return { ...prev, suitableSensors: updatedSuitableSensors };
      });
    } else if (name === "suitableVersion") {
      setFormData(prev => {
        const updatedSuitableVersion = checked
        ? [...prev.suitableVersion, value]
        : prev.suitableVersion.filter(item => item !== value);
        return { ...prev, suitableVersion: updatedSuitableVersion };
      });
    } else if (name === 'uploadedImage' && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const processImage = (file) => {
        return new Promise((resolve) => {
          const img = new Image();
          const reader = new FileReader();
          
          reader.onloadend = () => {
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              
              // Fill with white background
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw uploaded image on top
              ctx.drawImage(img, 0, 0);
              
              // Get new base64 image with white background
              const dataURL = canvas.toDataURL("image/jpeg", 0.95); // jpeg avoids transparency
              resolve(dataURL);
            };
            img.src = reader.result;
          };
          
          reader.readAsDataURL(file);
        });
      };
      
      Promise.all(files.map(processImage)).then((images) => {
        const names = files.map((file) => file.name);
        setFormData((prev) => ({
          ...prev,
          uploadedImage: [
            ...(Array.isArray(prev.uploadedImage) ? prev.uploadedImage : []),
            ...images,
          ],
          uploadedImageNames: [
            ...(Array.isArray(prev.uploadedImageNames) ? prev.uploadedImageNames : []),
            ...names,
          ],
        }));
      })
    } else if (name === 'sketchImage' && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, sketchImage: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSketchImage(reader.result); // Save as base64
      };
      reader.readAsDataURL(file);
    } else if (type === 'checkbox' && ['airtel', 'jio', 'bsnl', 'vi'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        network: {
          ...prev.network,
          [name]: checked ? true : false,
        },
      }));
    } else if (name.includes('Signal')) {
      setFormData(prev => ({
        ...prev,
        network: {
          ...prev.network,
          [name]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleSubmit = async () => {
    const requiredFields = [
      'surveyor', 'contact', 'location', 'gps', 'areaType', 'elephantFreq', 'lastSpotted', 'roadAccess', 'defenceMechanism',
      'wire', 'spikeWire', 'treesCamera', 'treesLight', 'suitableSensors', 'suitableVersion'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field] || (Array.isArray(formData[field]) && formData[field].length === 0));
    
    if (missingFields.length > 0) {
      alert(`Please fill in the required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    if (formData.wire <= 0 || isNaN(formData.wire)) {
      alert("Please enter a valid Wire Length (greater than 0).");
      return;
    }
    
    if (formData.spikeWire <= 0 || isNaN(formData.spikeWire)) {
      alert("Please enter a valid number of Spike Wires (greater than 0).");
      return;
    }
    
    if (!sketchImage) {
      alert("Please click 'Save Sketch' before submitting the survey.");
      return;
    }
    
    if (!formData.uploadedImage || formData.uploadedImage.length === 0) {
      alert("Please upload at least one image before submitting the survey.");
      return;
    }
    
    const providers = ['airtel', 'jio', 'bsnl', 'vi'];
    const selectedProviders = providers.filter(provider => formData.network?.[provider]);
    
    if (selectedProviders.length === 0) {
      alert("Please select at least one Mobile Network Provider.");
      return;
    }
    
    const missingSignal = selectedProviders.some(provider => {
      const signalValue = formData.network[`${provider}Signal`];
      return signalValue === undefined || signalValue === '' || isNaN(signalValue);
    });
    
    if (missingSignal) {
      alert("Please enter Signal Strength (Mbps) for all selected providers.");
      return;
    }
    
    try {
      const selectedNetwork = {};
      ['airtel', 'jio', 'bsnl', 'vi'].forEach(provider => {
        if (formData.network[provider]) {
          selectedNetwork[provider] = true;
          const signalKey = `${provider}Signal`;
          if (formData.network[signalKey]) {
            selectedNetwork[signalKey] = formData.network[signalKey];
          }
        }
      });
      
      const payload = {
        kanId,
        surveyor: formData.surveyor, 
        contact: formData.contact, 
        location: formData.location, 
        gps: formData.gps, 
        areaType: formData.areaType, 
        elephantFreq: formData.elephantFreq,
        lastSpotted: formData.lastSpotted,
        network: selectedNetwork,
        wire: formData.wire, 
        spikeWire: formData.spikeWire, 
        treesCamera: formData.treesCamera,
        treesLight: formData.treesLight, 
        roadAccess: formData.roadAccess,
        defenceMechanism: formData.defenceMechanism,
        suitableSensors: formData.suitableSensors,
        suitableVersion: formData.suitableVersion,
        uploadedImage: formData.uploadedImage,
        sketchImage,
      };
      
      const res = await axios.post('http://localhost:5000/api/form/submit', payload);
      navigate('/confirmation');
      window.location.reload();
      setKanId(res.data.kanId);
      setIsSubmitted(true);
      
      setFormData({
        surveyor: '', contact: '', location: '', gps: '', areaType: '', elephantFreq: '', lastSpotted: '', 
        network: { airtel: false, jio: false, bsnl: false, vi: false, airtelSignal: '', jioSignal: '', bsnlSignal: '', viSignal: '' },
        wire: '', spikeWire: '', treesCamera: '', treesLight: '', roadAccess: [], defenceMechanism: [], 
        suitableSensors: [], suitableVersion: [], uploadedImage: []
      });
      setUploadedImage([]);
      setSketchImage('');
    
    } catch (error) {
      alert("Failed to submit the form");
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  };
  
  // Function to handle the "Add Another Image" button click
  const handleAddImage = () => {
    document.getElementById('imageInput').click(); // Trigger file input click
  };

  // Use effect hook to trigger page transition after KAN ID is updated
  useEffect(() => {
    if (isSubmitted && kanId) {
      setCurrentPage(1); // Transition to page 1 after KAN ID has been updated
      setIsSubmitted(false);  // Reset submission flag
    }
  }, [kanId, isSubmitted]);  // Listen to changes in kanId and submission status

  
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-xl max-w-5xl w-full p-8 font-sans text-base">
        
        {/* Header Row */}
        <div className="flex justify-between items-center mb-8">
          <img src="/advitya_logo.png" alt="Advitiya" className="h-32" />
          <div className="text-center flex-grow">
            <h1 className="text-3xl font-bold underline">Survey Report For Device Installation</h1>
            <p className="mt-2 text-lg text-gray-700">
              Date: {new Date().toLocaleDateString()} &nbsp;&nbsp;&nbsp; KAN ID - {kanId}
            </p>
          </div>
          <img src="/kannit_logo.png" alt="Kannit" className="h-32" />
        </div>

        {/* Form Start */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Page 1: Surveyor and Location */}
          {currentPage === 1 && (
            <>
              {/* Section 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Surveyor Name</label>
                  <input 
                  type="text" 
                  name="surveyor" 
                  pattern="[A-Za-z\s]+" 
                  required 
                  value={formData.surveyor} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" 
                  placeholder="Enter surveyor name"/>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Local Contact</label>
                  <input 
                  type="tel" 
                  name="contact" 
                  inputMode="numeric" 
                  pattern="[0-9]*" 
                  required 
                  value={formData.contact} 
                  onChange={handleChange}
                  maxLength="10" 
                  minLength="10"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter local contact"/>
                </div>
              </div>
              {/* Section 2 */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-center border-b pb-2">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Location/Area Name</label>
                    <input 
                    type="text" 
                    name="location" 
                    required 
                    value={formData.location} 
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter location"/>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">GPS Coordinates</label>
                    <div className="flex space-x-2">
                      <input 
                      type="text" 
                      name="gps" 
                      required 
                      value={formData.gps} 
                      onChange={handleChange} 
                      placeholder="Auto or manual"
                      className="flex-grow border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      <button 
                      type="button" 
                      onClick={handleGPS} 
                      className="bg-blue-600 text-white font-semibold px-3 py-2 rounded hover:bg-blue-700 transition">
                        Get GPS
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <button 
                type="button" 
                onClick={() => setCurrentPage(2)}
                className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded hover:bg-yellow-500 transition">
                  Skip
                </button>
                <button 
                type="button" 
                onClick={() => setCurrentPage(2)} // Go to next page
                className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 transition">
                  Next
                </button>
              </div>
            </>
          )}

          {/* Page 2: Network Strength, Area Type, and Elephant Details */}
          {currentPage === 2 && (
            <>
            {/* Section 3: Network Strength */}
            <div className="bg-white shadow-2xl rounded-2xl p-6 mb-10 font-sans text-base">
              <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Network Strength</h2>
              <table className="w-full text-center text-base border-collapse mb-6">
                <thead>
                  <tr className="bg-gray-200 text-semibold text-gray-700">
                    <th colSpan={2} className="py-2 border-b-2 border-gray-400">Mobile Network Provider</th>
                    <th colSpan={1} className="py-2 border-b-2 border-gray-400">Signal Strength (Mbps)</th>
                  </tr>
                </thead>
                <tbody>
                  {['AIRTEL', 'JIO', 'BSNL', 'VI'].map((provider, index) => (
                    <tr key={provider} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 border border-gray-300 font-medium text-gray-800">{provider}</td>
                      <td className="py-3 border border-gray-300">
                        <label className="inline-flex items-center justify-center">
                          <input
                          type="checkbox"
                          required
                          name={provider.toLowerCase()}
                          value={provider}
                          onChange={handleChange}
                          checked={formData.network?.[provider.toLowerCase()] || false}
                          className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                        </label>
                      </td>
                      <td className="py-3 border border-gray-300">
                        <input
                        type="number"
                        required
                        name={`${provider.toLowerCase()}Signal`}
                        placeholder="e.g. 10 Mbps"
                        min="0"
                        step="1"
                        onChange={handleChange}
                        value={formData.network?.[`${provider.toLowerCase()}Signal`] || ''}
                        className="w-full px-3 py-2 text-center border rounded-md border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              
              {/* Section 4: Type of Area */}
              <h3 className="text-2xl font-semibold mb-6 text-center border-b pb-2">Type of Area</h3>
              <table className="border-2 border-black w-full mb-8">
                <tbody>
                  <tr className="align-middle">
                    <td className="text-lg font whitespace-nowrap">Type of Area:</td>
                    <td className="w-full p-4 font text-lg">
                      <input 
                      type="text" 
                      required 
                      name="areaType" 
                      value={formData.areaType || ''} 
                      onChange={handleChange}
                      className="w-full border-b-2 border-black focus:outline-none text-center"/>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {/* Section 5: Frequency of Elephant and Last Spotted */}
              <h3 className="text-2xl font-semibold mb-4 text-center border-b pb-2">Frequency of Elephant & Last Spotted</h3>
              <table className="border-2 border-black w-full table-fixed mb-8">
                <tbody>
                  <tr>
                    <td className="border-r-4 border-black p-2 align-middle">
                      <span className="font text-lg">Frequency of Elephant:</span>
                      <input 
                      type="text" 
                      required 
                      name="elephantFreq" 
                      value={formData.elephantFreq || ''} 
                      onChange={handleChange}
                      className="w-full border-b-2 border-black focus:outline-none text-center" />
                    </td>
                    <td className="p-2 align-middle">
                      <span className="font text-lg">Last Spotted:</span>
                      <input 
                      type="date" 
                      required 
                      name="lastSpotted" 
                      value={formData.lastSpotted || ''} 
                      onChange={handleChange}
                      className="w-full border-b-2 border-black focus:outline-none text-center"/>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <button 
              type="button" 
              onClick={() => setCurrentPage(1)} // Go to previous page
              className="bg-red-600 text-white font-semibold px-6 py-2 rounded hover:bg-red-700 transition" >
                Back
              </button>
              <button 
              type="button" 
              onClick={() => setCurrentPage(3)} // Go to next page
              className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded hover:bg-yellow-500 transition" >
                Skip
              </button>
              <button 
              type="button" 
              onClick={() => setCurrentPage(3)} // Submit the form
              className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 transition"
              >
                Next
              </button>
            </div>
          </>
          )}

          {/* Page3 : Underground Installation, Availability of Trees and Road Access & Defence Mechanism */}
          {currentPage === 3 && (
            <div className="bg-white shadow-lg rounded-xl p-6 relative">
              <h2 className="text-2xl font-semibold mb-6 text-center text-green-700">
                Installation & Environment Details
              </h2>
              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Length of Wire (in meters)</label>
                  <input
                  type="number"
                  name="wire"
                  required
                  placeholder="e.g., 250"
                  value={formData.wire}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Number of Spike Wires Needed</label>
                  <input
                  type="number"
                  name="spikeWire"
                  required
                  placeholder="e.g., 10"
                  value={formData.spikeWire}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                
                {/* Radio: Availability of Trees for Camera Mounting */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Availability of Trees for Camera Mounting</label>
                  <div className="flex gap-4">
                    <label>
                      <input
                      type="radio"
                      name="treesCamera"
                      value="Yes"
                      checked={formData.treesCamera === 'Yes'}
                      onChange={handleChange}
                      className="mr-1"
                      /> Yes 
                    </label>
                    <label>
                      <input
                      type="radio"
                      name="treesCamera"
                      value="No"
                      checked={formData.treesCamera === 'No'}
                      onChange={handleChange}
                      className="mr-1"
                      /> No
                    </label>
                  </div>
                </div>
                
                {/* Radio: Availability of Trees for Light Mounting */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Availability of Trees for Light Mounting</label>
                  <div className="flex gap-4">
                    <label>
                      <input
                      type="radio"
                      name="treesLight"
                      value="Yes"
                      checked={formData.treesLight === 'Yes'}
                      onChange={handleChange}
                      className="mr-1"
                      /> Yes
                    </label>
                    <label>
                      <input
                      type="radio"
                      name="treesLight"
                      value="No"
                      checked={formData.treesLight === 'No'}
                      onChange={handleChange}
                      /> No
                    </label>
                  </div>
                </div>
              </fieldset>
              
              {/* Section 8: Road Access & Defence Mechanism */}
              <h3 className="text-2xl font-semibold mt-8 mb-4 text-center text-green-700">Road Access & Defence Mechanism</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Road Access Options */}
                <div className="border-2 border-gray-300 rounded-lg p-4 shadow-md">
                  <h4 className="font-semibold text-lg text-center mb-4">Road Access Types</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Easy Access</span>
                      <input
                      type="checkbox"
                      name="roadAccess"
                      value="Easy Access"
                      checked={formData.roadAccess.includes("Easy Access")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Mud Road</span>
                      <input
                      type="checkbox"
                      name="roadAccess"
                      value="Mud Road"
                      checked={formData.roadAccess.includes("Mud Road")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Only by Walk</span>
                      <input
                      type="checkbox"
                      name="roadAccess"
                      value="Only by Walk"
                      checked={formData.roadAccess.includes("Only by Walk")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                  </div>
                </div>

                
                {/* Defence Mechanism Options */}
                <div className="border-2 border-gray-300 rounded-lg p-4 shadow-md">
                  <h4 className="font-semibold text-lg text-center mb-4">Available Defence Mechanisms</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Solar Fencing</span>
                      <input
                      type="checkbox"
                      name="defenceMechanism"
                      value="Solar Fencing"
                      checked={formData.defenceMechanism.includes("Solar Fencing")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Trench</span>
                      <input
                      type="checkbox"
                      name="defenceMechanism"
                      value="Trench"
                      checked={formData.defenceMechanism.includes("Trench")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Trench with Mud</span>
                      <input
                      type="checkbox"
                      name="defenceMechanism"
                      value="Trench with Mud"
                      checked={formData.defenceMechanism.includes("Trench with Mud")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Buttons (Right Bottom) */}
              <div className="flex justify-end gap-4 pt-6">
                <button 
                type="button" 
                onClick={() => setCurrentPage(2)} 
                className="bg-red-600 text-white font-semibold px-6 py-2 rounded hover:bg-red-700 transition">
                  Back
                </button>
                <button 
                type="button" 
                onClick={() => setCurrentPage(4)} 
                className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded hover:bg-yellow-500 transition">
                  Skip
                </button>
                <button 
                type="button" 
                onClick={() => setCurrentPage(4)} 
                className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 transition">
                  Next
                </button>
              </div>
            </div>
          )}
          
          {/* page 4: Product Selection*/}
          {currentPage === 4 && (
            <div className="bg-white shadow-lg rounded-xl p-6 relative">           
              {/* Section 9: Product Selection */}
              <h3 className="text-2xl font-semibold mt-8 mb-4 text-center text-green-700">Product Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Suitable Sensors for the Area */}
                <div className="border-2 border-gray-300 rounded-lg p-4 shadow-md">
                  <h4 className="font-semibold text-lg text-center mb-4">Suitable Sensors for the Area</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg">AI Camera</span>
                      <input
                      type="checkbox"
                      name="suitableSensors"
                      value="AI Camera"
                      checked={formData.suitableSensors.includes("AI Camera")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Metal Wire Sensor</span>
                      <input
                      type="checkbox"
                      name="suitableSensors"
                      value="Metal Wire Sensor"
                      checked={formData.suitableSensors.includes("Metal Wire Sensor")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Radar Sensor (FMCW)</span>
                      <input
                      type="checkbox"
                      name="suitableSensors"
                      value="Radar Sensor (FMCW)"
                      checked={formData.suitableSensors.includes("Radar Sensor (FMCW)")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                  </div>
                </div>

                
                {/* Suitable Version to be Installed */}
                <div className="border-2 border-gray-300 rounded-lg p-4 shadow-md">
                  <h4 className="font-semibold text-lg text-center mb-4">Suitable Version to be Installed</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Attni</span>
                      <input
                      type="checkbox"
                      name="suitableVersion"
                      value="Attni"
                      checked={formData.suitableVersion.includes("Attni")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Pratham</span>
                      <input
                      type="checkbox"
                      name="suitableVersion"
                      value="Pratham"
                      checked={formData.suitableVersion.includes("Pratham")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg">Prachand</span>
                      <input
                      type="checkbox"
                      name="suitableVersion"
                      value="Prachand"
                      checked={formData.suitableVersion.includes("Prachand")}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-green-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Buttons (Right Bottom) */}
              <div className="flex justify-end gap-4 pt-6">
                <button 
                type="button" 
                onClick={() => setCurrentPage(3)} 
                className="bg-red-600 text-white font-semibold px-6 py-2 rounded hover:bg-red-700 transition">
                  Back
                </button>
                <button 
                type="button" 
                onClick={() => setCurrentPage(5)} 
                className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded hover:bg-yellow-500 transition">
                  Skip
                </button>
                <button 
                type="button" 
                onClick={() => setCurrentPage(5)} 
                className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 transition">
                  Next
                </button>
              </div>
            </div>
          )}
          
          {/* page 5: Rough Top-View Sketch */}
          {currentPage === 5 && (
            <div className="space-y-8">
              {/* Section 10: Sketch */}
              <div className="border-2 border-black p-4 rounded-xl shadow-md bg-white">
                <h2 className="text-2xl font-semibold text-center mb-4">Rough Top-View Sketch</h2>
                <div className="flex justify-center">
                  <canvas
                  ref={canvasRef}
                  style={{
                    border: '1px solid black',
                    cursor: tool === 'pencil'
                      ? 'url("/pencil2.png") 16 16, crosshair'
                      : tool === 'eraser'
                      ? 'url("/eraser2.png") 16 16, pointer'
                      : 'default',
                    zIndex: 100,
                  }}
                  width="800"
                  height="300"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="border border-black "/>
                </div>
                <div className="flex justify-center space-x-4 mt-4">
                  <button 
                  type="button" 
                  onClick={handlePencilClick} 
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                    Pencil
                  </button>
                  <button 
                  type="button" 
                  onClick={handleEraserClick} 
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                    Eraser
                  </button>
                  <button 
                  type="button" 
                  onClick={clearCanvas} 
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                    Clear
                  </button>
                  <button 
                  type="button" 
                  onClick={saveCanvasImage} 
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Save Sketch
                  </button>
                </div>
              </div>
              
              {/* Navigation Buttons (Right Bottom) */}
              <div className="flex justify-end gap-4 pt-6">
                <button 
                type="button" 
                onClick={() => setCurrentPage(4)} 
                className="bg-red-600 text-white font-semibold px-6 py-2 rounded hover:bg-red-700 transition">
                  Back
                </button>
                <button 
                type="button" 
                onClick={() => setCurrentPage(6)} 
                className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded hover:bg-yellow-500 transition">
                  Skip
                </button>
                <button 
                type="button" 
                onClick={() => setCurrentPage(6)} 
                className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 transition">
                  Next
                </button>
              </div>
            </div>
          )}
          
          {/* page 6: Upload Image */}
          {currentPage === 6 && (
            <div className="space-y-8">
              {/* Section 11: Image Upload */}
              <div className="border-2 border-black p-4 rounded-xl shadow-md bg-white">
                <h2 className="text-2xl font-semibold text-center mb-4">Upload Image</h2>
                <div className="flex justify-center space-x-8">
                  <input
                  id="imageInput"
                  type="file"
                  name="uploadedImage"
                  required
                  accept="image/*"
                  multiple
                  onChange={handleChange}
                  className="border-2 border-black p-2 w-full max-w-md"
                  />
                  <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-blue-700 text-white font-semibold rounded hover:bg-green-800"
                  >
                    Add Image
                  </button>
                </div>
                
                {/* Display image names and allow removal */}
                {formData.uploadedImage && formData.uploadedImage.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-3">Uploaded Images:</h3>
                    <ul className="divide-y divide-gray-300 border rounded-lg">
                      {formData.uploadedImageNames.map((name, index) => (
                        <li key={index} className="flex items-center justify-between px-4 py-2">
                          <span className="text-gray-800 font-medium truncate">{name}</span>\
                          <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Buttons */}
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                  type="button"
                  onClick={() => setCurrentPage(5)}
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded hover:bg-gray-700"
                  >
                    Back
                  </button>
                  <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-green-700 text-white font-semibold rounded hover:bg-green-800"
                  >
                    Submit Survey
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default MultiPageForm;