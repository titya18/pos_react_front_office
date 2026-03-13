import React, { useEffect, useState } from "react";
import Pagination from "../components/Pagination";
import ExportDropdown from "@/components/ExportDropdown";

import { StockValuationRow } from "@/data_types/types";
import * as apiClient from "@/api/stock";

const StockValuationReport: React.FC = () => {

  const [rows, setRows] = useState<StockValuationRow[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(10);
  const [total,setTotal] = useState(0);

  useEffect(()=>{

    const fetchData = async () => {

      const res = await apiClient.getStockValuation(
        page,
        null,
        pageSize
      );

      setRows(res.data || []);
      setTotalValue(res.summary?.totalStockValue || 0);
      setTotal(res.pagination?.total || 0);

    };

    fetchData();

  },[page,pageSize]);

  const exportData = rows.map((r,i)=>({

    No: (page-1)*pageSize+i+1,
    Product: r.productName,
    SKU: r.sku,
    Branch: r.branchName,
    Quantity: r.quantity,
    Cost: r.unitCost,
    Value: r.stockValue

  }));

  return (

    <div className="panel">

      <div className="flex justify-between mb-4">

        <h2 className="text-lg font-semibold">
          Stock Valuation Report
        </h2>

        <ExportDropdown data={exportData} prefix="StockValuation" />

      </div>

      <table className="dataTable-table min-w-full">

        <thead>
          <tr>
            <th>No</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Branch</th>
            <th>Quantity</th>
            <th>Cost</th>
            <th>Value</th>
          </tr>
        </thead>

        <tbody>

          {rows.map((r,i)=>(

            <tr key={r.variantId}>

              <td>{(page-1)*pageSize+i+1}</td>

              <td>{r.productName}</td>

              <td>{r.sku}</td>

              <td>{r.branchName}</td>

              <td>{r.quantity}</td>

              <td>${Number(r.unitCost).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>

              <td className="font-semibold text-green-600">
                ${Number(r.stockValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <div className="mt-4 text-right text-lg font-bold">

        Total Inventory Value : ${Number(totalValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}

      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(s)=>{setPageSize(s);setPage(1)}}
      />

    </div>
  );
};

export default StockValuationReport;