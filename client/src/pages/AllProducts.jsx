import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import ProductCart from "../components/ProductCart";

const AllProducts = () => {
  const { products, searchQuery } = useAppContext();
  const [fillteredProducts, setFillteredProducts] = useState([]);

  useEffect(() => {
    // --- FIX: Add defensive check for searchQuery to ensure it's a string ---
    if (typeof searchQuery === 'string' && searchQuery.length > 0) {
      setFillteredProducts(products.filter(
        product => product.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      // Ensure products is an array before setting
      setFillteredProducts(Array.isArray(products) ? products : []);
    }
  }, [products, searchQuery]);

  return (
    <div className=" mt-16 flex flex-col">
      <div className=" flex flex-col items-end w-max">
        <p className=" text-2xl font-medium uppercase">All Products</p>
        <div className=" w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      <div className=" grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6">
        {
          // Ensure fillteredProducts is an array before mapping
          Array.isArray(fillteredProducts) && fillteredProducts.filter((product) => product.inStock).map((product, index) => (
            <ProductCart key={product._id || index} product={product} /> // Use product._id for key if available
          ))
        }
        {fillteredProducts.filter((product) => product.inStock).length === 0 && (
          <p className="col-span-full text-center text-gray-500 mt-5">No products found or available.</p>
        )}
      </div>

    </div>
  );
};

export default AllProducts;
