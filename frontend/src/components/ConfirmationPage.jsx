import React from 'react';
import { Link } from 'react-router-dom';

const ConfirmationPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center p-8 border-2 border-green-500 rounded-xl shadow-md bg-white">
        <h1 className="text-3xl font-bold text-green-700 mb-4">Thank You!</h1>
        <p className="text-lg text-gray-700 mb-6">Your response has been successfully submitted.</p>
        <Link to="/" className="text-white bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-semibold">
          Fill New Response
        </Link>
      </div>
    </div>
  );
};

export default ConfirmationPage;
