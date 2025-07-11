"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface Product {
  _id: string;
  name: string;
  brand: string;
  price: number;
  ram: string;
  processor: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/search", {
          params: { q: query, page },
        });
        setProducts(res.data.results);
        console.log(res.data.results);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
  }, [query, page]);

  return (
    <main className='p-8 max-w-3xl mx-auto'>
      <input
        type='text'
        placeholder='Search products...'
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
        className='border border-gray-300 rounded p-2 w-full mb-6'
      />

      <ul>
        {products.map((product) => (
          <li key={product._id} className='border-b py-3'>
            <strong>{product.name}</strong> — {product.brand}, {product.ram}, $
            {product.price}
          </li>
        ))}
      </ul>

      <div className='mt-6 flex justify-between items-center'>
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className='px-4 py-2 border rounded disabled:opacity-50'
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={products.length < 5}
          onClick={() => setPage((p) => p + 1)}
          className='px-4 py-2 border rounded disabled:opacity-50'
        >
          Next
        </button>
      </div>
    </main>
  );
}
