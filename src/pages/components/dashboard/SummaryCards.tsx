import { FiShoppingCart, FiDollarSign, FiCreditCard, FiPackage } from "react-icons/fi";

const Card = ({ title, value, color, icon: Icon }: any) => (
  <div className={`rounded-lg shadow-lg p-5 flex items-center border-l-8 ${color} bg-white hover:shadow-2xl transition`}>
    <div className="p-3 rounded-full bg-gray-100 mr-4">
      <Icon className="w-8 h-8 text-gray-700" />
    </div>
    <div>
      <p className="text-gray-500 font-medium text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  </div>
);

const SummaryCards = ({ invoices, purchases, payments }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
    <Card
      title="Invoices"
      value={invoices?.totalInvoice || 0}
      color="border-green-400"
      icon={FiShoppingCart}
    />
    <Card
      title="Sales Amount"
      value={invoices?.totalAmount || 0}
      color="border-blue-400"
      icon={FiDollarSign}
    />
    <Card
      title="Paid"
      value={payments?.totalPaid || 0}
      color="border-purple-400"
      icon={FiCreditCard}
    />
    <Card
      title="Purchases"
      value={purchases?.grandTotalAmount || 0}
      color="border-red-400"
      icon={FiPackage}
    />
  </div>
);

export default SummaryCards;