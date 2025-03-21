import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AppContextProvider } from "./contexts/AppContext";
import PrivateRoute from "./PrivateRoute";
import Layout from "./pages/layouts/Layout";
import SignUp from "./pages/signup/SignUp";
import SignIn from "./pages/signin/SignIn";
import Dashboard from "./pages/dashboard/Dashboard";
import ModulePermission from "./pages/module_permission/ModulePermission";
import Role from "./pages/role/Role";
import AddRole from "./pages/role/AddRole";
import EditRole from "./pages/role/EditRole";
import User from "./pages/user/User";
import UserForm from "./pages/user/UserForm";
import Branch from "./pages/branch/Branch";
import PaymentMethod from "./pages/paymentmethod/PaymentMethod";
import Category from "./pages/category/Category";
import Unit from "./pages/unit/Unit";
import Brand from "./pages/brand/Brand";
import Product from "./pages/product/Product";
import ProductVariant from "./pages/product_variant/ProductVariant";
import Supplier from "./pages/supplier/Supplier";
import Purchase from "./pages/purchase/Purchase";
import PurchaseForm from "./pages/purchase/PurchaseForm";
import PrintPurchase from "./pages/purchase/PrintPurchase";
import NotFound from "./pages/notfound/NotFount";

const App: React.FC = () => {
    return (
        <Router>
            <AppContextProvider>
                <Routes>
                    {/* Sign-In and Sign-Up */}
                    <Route path="/" element={<SignIn />} />
                    <Route path="/asignup" element={<SignUp />} />

                    {/* Dashboard */}
                    <Route path="/dashboard" element={<PrivateRoute element={<Layout><Dashboard /></Layout>} />} />

                    {/* Role and Permission */}
                    <Route path="/modulepermission" element={<PrivateRoute element={<Layout><ModulePermission /></Layout>} />} />
                    <Route path="/role" element={<PrivateRoute element={<Layout><Role /></Layout>} />} />
                    <Route path="/addrole" element={<PrivateRoute element={<Layout><AddRole /></Layout>} />} />
                    <Route path="/editrole/:id" element={<PrivateRoute element={<Layout><EditRole /></Layout>} />} />

                    {/* User */}
                    <Route path="/user" element={<PrivateRoute element={<Layout><User /></Layout>} />} />
                    <Route path="/adduser" element={<PrivateRoute element={<Layout><UserForm /></Layout>} />} />
                    <Route path="/edituser/:id" element={<PrivateRoute element={<Layout><UserForm /></Layout>} />} />

                    {/* Branch */}
                    <Route path="/branches" element={<PrivateRoute element={<Layout><Branch /></Layout>} />} />

                    {/* Payment Method */}
                    <Route path="/paymentmethod" element={<PrivateRoute element={<Layout><PaymentMethod /></Layout>} />} />
                    {/* Category */}
                    <Route path="/categories" element={<PrivateRoute element={<Layout><Category /></Layout>} />} />
                    {/* Unit */}
                    <Route path="/units" element={<PrivateRoute element={<Layout><Unit /></Layout>} />} />
                    {/* Brand */}
                    <Route path="/brands" element={<PrivateRoute element={<Layout><Brand /></Layout>} />} />
                    {/* Product */}
                    <Route path="/products" element={<PrivateRoute element={<Layout><Product /></Layout>} />} />
                    {/* Product Variant */}
                    <Route path="/productvariant/:id" element={<PrivateRoute element={<Layout><ProductVariant /></Layout>} />} />
                    {/* Supplier */}
                    <Route path="/supplier" element={<PrivateRoute element={<Layout><Supplier /></Layout>} />} />
                    {/* Purchase */}
                    <Route path="/purchase" element={<PrivateRoute element={<Layout><Purchase /></Layout>} />} />
                    <Route path="/addpurchase" element={<PrivateRoute element={<Layout><PurchaseForm /></Layout>} />} />
                    <Route path="/editpurchase/:id" element={<PrivateRoute element={<Layout><PurchaseForm /></Layout>} />} />
                    <Route path="/printpurchase/:id" element={<PrivateRoute element={<Layout><PrintPurchase /></Layout>} />} />

                    {/* Catch-all route for undefined paths */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AppContextProvider>
        </Router>
    );
};

export default App;
