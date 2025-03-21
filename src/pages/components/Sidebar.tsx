import React, { useState } from "react";
import { useLocation } from 'react-router-dom';
// import { AppContext } from "../../contexts/AppContext";
import { useAppContext } from '../../hooks/useAppContext';
import { NavLink } from "react-router-dom";

// Define a type for the state
// type activeDropdown = 'user' | 'invoice' | 'error_list' | null;
type activeDropdown = 'dashboard' | 'user' | null;
// type activeDropdownSub = 'error_list' | null;

const Sidebar: React.FC = () => {
    const location = useLocation();
    const pathname = location.pathname;
    // // Find the last index of a slash
    // const lastSlashIndex = pathname.lastIndexOf('/');
    // // Extract the last segment after the last slash
    // const lastSegment = pathname.slice(lastSlashIndex + 1);
    
    const defaultClass = 'group'; // Your default class

    // Split the pathname into an array of segments
    const pathSegments = pathname.split('/');
    // Extract the first segment after the initial slash
    const lastSegment = pathSegments[2];

    const { toggleSidebar, hasPermission } = useAppContext();

    const handleClick = () => {
        toggleSidebar();
        document.body.classList.toggle('toggle-sidebar');
    };

    const determineActiveDropdown = (segment: string): activeDropdown => {
        switch (segment) {
            case 'user':
                return 'user';
            case 'dashboard':
                return 'dashboard';
            // case 'invoice':
            // case 'error_list': // Add other segments that should open the invoice dropdown
            //     return 'invoice';
            default:
                return null;
        }
    };

    const getInitialDropdownState = (): activeDropdown => {
        const savedDropdown = localStorage.getItem('activeDropdown');
        return savedDropdown ? (savedDropdown as activeDropdown) : determineActiveDropdown(lastSegment);
    };

    const [activeDropdown, setActiveDropdown] = useState<activeDropdown>(getInitialDropdownState());

    const handleToggleMenu = (labelName: activeDropdown) => {
        const newActiveDropdown = labelName === activeDropdown ? activeDropdown : labelName;
        setActiveDropdown(newActiveDropdown);
        // setActiveDropdown(prev => (prev === activeDropdown ? null : activeDropdown));
        localStorage.setItem('activeDropdown', newActiveDropdown || '');
    };
    

    return (
        <div className="{'dark text-white-dark' : $store.app.semidark}">
            <nav
                x-data="sidebar"
                className="sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300"
            >
                <div className="h-full bg-white dark:bg-[#0e1726]">
                    <div className="flex items-center justify-between px-4 py-3">
                        <NavLink to="/dashboard" className="main-logo flex shrink-0 items-center">
                            <img className="ml-[5px] w-8 flex-none" src="/../admin_assets/images/logo.svg" alt="Company logo" />
                            <span className="align-middle text-2xl font-semibold ltr:ml-1.5 rtl:mr-1.5 dark:text-white-light lg:inline">Lorn Titya</span>
                        </NavLink>
                        <button
                            onClick={handleClick}
                            className="collapse-icon flex h-8 w-8 items-center rounded-full transition duration-300 hover:bg-gray-500/10 rtl:rotate-180 dark:text-white-light dark:hover:bg-dark-light/10"
                        >
                            <svg className="m-auto h-5 w-5" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 19L7 12L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path
                                    opacity="0.5"
                                    d="M16.9998 19L10.9998 12L16.9998 5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                    <ul
                        className="perfect-scrollbar relative h-[calc(100vh-80px)] space-y-0.5 overflow-y-auto overflow-x-hidden p-4 py-0 font-semibold"
                    >

                        {/* Start I comment this blog for example use later on */}

                            <li className="menu nav-item">
                                <button
                                    type="button"
                                    className={`nav-link group ${activeDropdown == 'user' ? 'active' : ''}`}
                                    onClick={() => handleToggleMenu('user')}
                                >
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                                            <path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192l42.7 0c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0L21.3 320C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7l42.7 0C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3l-213.3 0zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352l117.3 0C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7l-330.7 0c-14.7 0-26.7-11.9-26.7-26.7z"/>
                                        </svg>

                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Users</span>
                                    </div>
                                    <div className={`rtl:rotate-180 ${activeDropdown == 'user' ? '!rotate-90' : ''}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>
                                <ul className={`sub-menu text-gray-500 collapsible ${activeDropdown == 'user' ? 'expanded' : ''}`}>
                                    {hasPermission('User-View') &&
                                        <li>
                                            <NavLink to="/user" className={`${['user','adduser','edituser'].includes(lastSegment) ? 'active' : ''}`}>Users</NavLink>
                                        </li>
                                    }
                                    {hasPermission('Role-View') &&
                                        <li>
                                            <NavLink to="/role" className={`${['role','addrole','editrole'].includes(lastSegment) ? 'active' : ''}`}>Roles</NavLink>
                                        </li>
                                    }
                                    {hasPermission('Permission-View') &&
                                        <li>
                                            <NavLink to="/modulepermission" className={`${lastSegment == 'permission' ? 'active' : ''}`}>Permissions</NavLink>
                                        </li>
                                    }
                                </ul>
                            </li>

                            {/* <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]">
                                <svg
                                    className="hidden h-5 w-4 flex-none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>Apps</span>
                            </h2>

                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item">
                                        <a href="apps-chat.html" className="group">
                                            <div className="flex items-center">
                                                <svg
                                                    className="shrink-0 group-hover:!text-primary"
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                        d="M10.4036 22.4797L10.6787 22.015C11.1195 21.2703 11.3399 20.8979 11.691 20.6902C12.0422 20.4825 12.5001 20.4678 13.4161 20.4385C14.275 20.4111 14.8523 20.3361 15.3458 20.1317C16.385 19.7012 17.2106 18.8756 17.641 17.8365C17.9639 17.0571 17.9639 16.0691 17.9639 14.093V13.2448C17.9639 10.4683 17.9639 9.08006 17.3389 8.06023C16.9892 7.48958 16.5094 7.0098 15.9388 6.66011C14.919 6.03516 13.5307 6.03516 10.7542 6.03516H8.20964C5.43314 6.03516 4.04489 6.03516 3.02507 6.66011C2.45442 7.0098 1.97464 7.48958 1.62495 8.06023C1 9.08006 1 10.4683 1 13.2448V14.093C1 16.0691 1 17.0571 1.32282 17.8365C1.75326 18.8756 2.57886 19.7012 3.61802 20.1317C4.11158 20.3361 4.68882 20.4111 5.5477 20.4385C6.46368 20.4678 6.92167 20.4825 7.27278 20.6902C7.6239 20.8979 7.84431 21.2703 8.28514 22.015L8.5602 22.4797C8.97002 23.1721 9.9938 23.1721 10.4036 22.4797ZM13.1928 14.5171C13.7783 14.5171 14.253 14.0424 14.253 13.4568C14.253 12.8713 13.7783 12.3966 13.1928 12.3966C12.6072 12.3966 12.1325 12.8713 12.1325 13.4568C12.1325 14.0424 12.6072 14.5171 13.1928 14.5171ZM10.5422 13.4568C10.5422 14.0424 10.0675 14.5171 9.48193 14.5171C8.89637 14.5171 8.42169 14.0424 8.42169 13.4568C8.42169 12.8713 8.89637 12.3966 9.48193 12.3966C10.0675 12.3966 10.5422 12.8713 10.5422 13.4568ZM5.77108 14.5171C6.35664 14.5171 6.83133 14.0424 6.83133 13.4568C6.83133 12.8713 6.35664 12.3966 5.77108 12.3966C5.18553 12.3966 4.71084 12.8713 4.71084 13.4568C4.71084 14.0424 5.18553 14.5171 5.77108 14.5171Z"
                                                        fill="currentColor"
                                                    />
                                                    <path
                                                        opacity="0.5"
                                                        d="M15.486 1C16.7529 0.999992 17.7603 0.999986 18.5683 1.07681C19.3967 1.15558 20.0972 1.32069 20.7212 1.70307C21.3632 2.09648 21.9029 2.63623 22.2963 3.27821C22.6787 3.90219 22.8438 4.60265 22.9226 5.43112C22.9994 6.23907 22.9994 7.24658 22.9994 8.51343V9.37869C22.9994 10.2803 22.9994 10.9975 22.9597 11.579C22.9191 12.174 22.8344 12.6848 22.6362 13.1632C22.152 14.3323 21.2232 15.2611 20.0541 15.7453C20.0249 15.7574 19.9955 15.7691 19.966 15.7804C19.8249 15.8343 19.7039 15.8806 19.5978 15.915H17.9477C17.9639 15.416 17.9639 14.8217 17.9639 14.093V13.2448C17.9639 10.4683 17.9639 9.08006 17.3389 8.06023C16.9892 7.48958 16.5094 7.0098 15.9388 6.66011C14.919 6.03516 13.5307 6.03516 10.7542 6.03516H8.20964C7.22423 6.03516 6.41369 6.03516 5.73242 6.06309V4.4127C5.76513 4.29934 5.80995 4.16941 5.86255 4.0169C5.95202 3.75751 6.06509 3.51219 6.20848 3.27821C6.60188 2.63623 7.14163 2.09648 7.78361 1.70307C8.40759 1.32069 9.10805 1.15558 9.93651 1.07681C10.7445 0.999986 11.7519 0.999992 13.0188 1H15.486Z"
                                                        fill="currentColor"
                                                    />
                                                </svg>
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Chat</span>
                                            </div>
                                        </a>
                                    </li>
                                    <li className="menu nav-item">
                                        <button
                                            type="button"
                                            className={`nav-link group ${activeDropdown == 'invoice' ? 'active' : ''}`}
                                            onClick={() => handleToggleMenu('invoice')}
                                        >
                                            <div className="flex items-center">
                                                <svg
                                                    className="shrink-0 group-hover:!text-primary"
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        opacity="0.5"
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                        d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                                                        fill="currentColor"
                                                    />
                                                    <path
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                        d="M12 5.25C12.4142 5.25 12.75 5.58579 12.75 6V6.31673C14.3804 6.60867 15.75 7.83361 15.75 9.5C15.75 9.91421 15.4142 10.25 15 10.25C14.5858 10.25 14.25 9.91421 14.25 9.5C14.25 8.82154 13.6859 8.10339 12.75 7.84748V11.3167C14.3804 11.6087 15.75 12.8336 15.75 14.5C15.75 16.1664 14.3804 17.3913 12.75 17.6833V18C12.75 18.4142 12.4142 18.75 12 18.75C11.5858 18.75 11.25 18.4142 11.25 18V17.6833C9.61957 17.3913 8.25 16.1664 8.25 14.5C8.25 14.0858 8.58579 13.75 9 13.75C9.41421 13.75 9.75 14.0858 9.75 14.5C9.75 15.1785 10.3141 15.8966 11.25 16.1525V12.6833C9.61957 12.3913 8.25 11.1664 8.25 9.5C8.25 7.83361 9.61957 6.60867 11.25 6.31673V6C11.25 5.58579 11.5858 5.25 12 5.25ZM11.25 7.84748C10.3141 8.10339 9.75 8.82154 9.75 9.5C9.75 10.1785 10.3141 10.8966 11.25 11.1525V7.84748ZM14.25 14.5C14.25 13.8215 13.6859 13.1034 12.75 12.8475V16.1525C13.6859 15.8966 14.25 15.1785 14.25 14.5Z"
                                                        fill="currentColor"
                                                    />
                                                </svg>
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Invoice</span>
                                            </div>
                                            <div className={`rtl:rotate-180 ${activeDropdown == 'invoice' ? '!rotate-90' : ''}`}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M9 5L15 12L9 19"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </div>
                                        </button>
                                        <ul className={`sub-menu text-gray-500 collapsible ${activeDropdown == 'invoice' ? 'expanded' : ''}`}>
                                            <li>
                                                <a href="apps-invoice-list.html">List</a>
                                            </li>
                                            <li x-data="{subActive:null}">
                                                <button
                                                    type="button"
                                                    className="before:h-[5px] before:w-[5px] before:rounded before:bg-gray-300 hover:bg-gray-100 ltr:before:mr-2 rtl:before:ml-2 dark:text-[#888ea8] dark:hover:bg-gray-900"
                                                    onClick={() => handleToggleMenuSub('error_list')}
                                                >
                                                    Error
                                                    <div className="ltr:ml-auto rtl:mr-auto rtl:rotate-180">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path
                                                                opacity="0.5"
                                                                d="M6.25 19C6.25 19.3139 6.44543 19.5946 6.73979 19.7035C7.03415 19.8123 7.36519 19.7264 7.56944 19.4881L13.5694 12.4881C13.8102 12.2073 13.8102 11.7928 13.5694 11.5119L7.56944 4.51194C7.36519 4.27364 7.03415 4.18773 6.73979 4.29662C6.44543 4.40551 6.25 4.68618 6.25 5.00004L6.25 19Z"
                                                                fill="currentColor"
                                                            />
                                                            <path
                                                                fill-rule="evenodd"
                                                                clip-rule="evenodd"
                                                                d="M10.5119 19.5695C10.1974 19.2999 10.161 18.8264 10.4306 18.5119L16.0122 12L10.4306 5.48811C10.161 5.17361 10.1974 4.70014 10.5119 4.43057C10.8264 4.161 11.2999 4.19743 11.5695 4.51192L17.5695 11.5119C17.8102 11.7928 17.8102 12.2072 17.5695 12.4881L11.5695 19.4881C11.2999 19.8026 10.8264 19.839 10.5119 19.5695Z"
                                                                fill="currentColor"
                                                            />
                                                        </svg>
                                                    </div>
                                                </button>
                                                <ul className={`sub-menu text-gray-500 ltr:ml-2 rtl:mr-2 collapsible ${activeDropdownSub == 'error_list' ? 'expanded' : ''}`}>
                                                    <li>
                                                        <a href="pages-error404.html" target="_blank">404</a>
                                                    </li>
                                                </ul>
                                            </li>
                                        </ul>
                                    
                                    </li>
                                </ul>
                            </li> */}

                        {/* End I comment this blog for example use later on */}
                        
                        {hasPermission('Branch-View') && 
                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item" onClick={() => handleToggleMenu(null)}>
                                        <NavLink to="/branches" className={({ isActive }) => `${defaultClass} ${isActive ? 'active' : ''}`.trim()}>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="shrink-0 group-hover:!text-primary">
                                                    <path d="M80 104a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm80-24c0 32.8-19.7 61-48 73.3l0 87.8c18.8-10.9 40.7-17.1 64-17.1l96 0c35.3 0 64-28.7 64-64l0-6.7C307.7 141 288 112.8 288 80c0-44.2 35.8-80 80-80s80 35.8 80 80c0 32.8-19.7 61-48 73.3l0 6.7c0 70.7-57.3 128-128 128l-96 0c-35.3 0-64 28.7-64 64l0 6.7c28.3 12.3 48 40.5 48 73.3c0 44.2-35.8 80-80 80s-80-35.8-80-80c0-32.8 19.7-61 48-73.3l0-6.7 0-198.7C19.7 141 0 112.8 0 80C0 35.8 35.8 0 80 0s80 35.8 80 80zm232 0a24 24 0 1 0 -48 0 24 24 0 1 0 48 0zM80 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"/>
                                                </svg>
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Branches</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        }

                        {hasPermission('Payment-Method-View') && 
                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item" onClick={() => handleToggleMenu(null)}>
                                        <NavLink to="/paymentmethod" className={({ isActive }) => `${defaultClass} ${isActive ? 'active' : ''}`.trim()}>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                                                    <g fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" d="M15 5H9c-2.809 0-4.213 0-5.222.674a4 4 0 0 0-1.104 1.104C2 7.787 2 9.19 2 12s0 4.213.674 5.222a4 4 0 0 0 1.104 1.104c.347.232.74.384 1.222.484M9 19h6c2.809 0 4.213 0 5.222-.674a4 4 0 0 0 1.104-1.104C22 16.213 22 14.81 22 12s0-4.213-.674-5.222a4 4 0 0 0-1.104-1.104c-.347-.232-.74-.384-1.222-.484"></path>
                                                        <path d="M9 9a3 3 0 1 0 0 6m6-6a3 3 0 1 1 0 6"></path><path strokeLinecap="round" d="M9 5v14m6-14v14"></path>
                                                    </g>
                                                </svg>
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Payment Method</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        }

                        {hasPermission('Product-View') &&
                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item" onClick={() => handleToggleMenu(null)}>
                                        <NavLink to="/products" className={`${['products','productvariant'].includes(lastSegment) ? 'active' : ''}`}>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                    <path d="M326.3 218.8c0 20.5-16.7 37.2-37.2 37.2h-70.3v-74.4h70.3c20.5 0 37.2 16.7 37.2 37.2zM504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-128.1-37.2c0-47.9-38.9-86.8-86.8-86.8H169.2v248h49.6v-74.4h70.3c47.9 0 86.8-38.9 86.8-86.8z"/>
                                                </svg>
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Products</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        }

                        {hasPermission('Category-View') &&
                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item" onClick={() => handleToggleMenu(null)}>
                                        <NavLink to="/categories" className={({ isActive }) => `${defaultClass} ${isActive ? 'active' : ''}`.trim()}>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                    <path d="M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z"/>
                                                </svg>
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Categories</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        }

                        {hasPermission('Brand-View') &&
                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item" onClick={() => handleToggleMenu(null)}>
                                        <NavLink to="/brands" className={({ isActive }) => `${defaultClass} ${isActive ? 'active' : ''}`.trim()}>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                    <path d="M91.7 96C106.3 86.8 116 70.5 116 52C116 23.3 92.7 0 64 0S12 23.3 12 52c0 16.7 7.8 31.5 20 41l0 3 0 352 0 64 64 0 0-64 373.6 0c14.6 0 26.4-11.8 26.4-26.4c0-3.7-.8-7.3-2.3-10.7L432 272l61.7-138.9c1.5-3.4 2.3-7 2.3-10.7c0-14.6-11.8-26.4-26.4-26.4L91.7 96z"/>
                                                </svg>
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Brands</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        }

                        {hasPermission('Unit-View') &&
                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item" onClick={() => handleToggleMenu(null)}>
                                        <NavLink to="/units" className={({ isActive }) => `${defaultClass} ${isActive ? 'active' : ''}`.trim()}>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                                    <path d="M243.6 91.6L323.7 138.4C326.6 140 326.7 144.6 323.7 146.2L228.5 201.9C225.6 203.6 222.2 203.4 219.5 201.9L124.4 146.2C121.4 144.6 121.4 140 124.4 138.4L204.4 91.6V0L0 119.4V358.3L78.4 312.5V218.9C78.3 215.6 82.2 213.2 85.1 215L180.3 270.6C183.2 272.3 184.8 275.3 184.8 278.5V389.7C184.8 393 181 395.4 178.1 393.6L98 346.8L19.6 392.6L224 512L428.4 392.6L350 346.8L269.9 393.6C267.1 395.3 263.1 393.1 263.2 389.7V278.5C263.2 275.1 265.1 272.2 267.7 270.6L362.9 215C365.7 213.2 369.7 215.5 369.6 218.9V312.5L448 358.3V119.4L243.6 0V91.6z"/>
                                                </svg>
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Units</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        }

                        {hasPermission('Supplier-View') &&
                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item" onClick={() => handleToggleMenu(null)}>
                                        <NavLink to="/supplier" className={({ isActive }) => `${defaultClass} ${isActive ? 'active' : ''}`.trim()}>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                                                    <path d="M112 0C85.5 0 64 21.5 64 48l0 48L16 96c-8.8 0-16 7.2-16 16s7.2 16 16 16l48 0 208 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L64 160l-16 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l16 0 176 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L64 224l-48 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l48 0 144 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L64 288l0 128c0 53 43 96 96 96s96-43 96-96l128 0c0 53 43 96 96 96s96-43 96-96l32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l0-64 0-32 0-18.7c0-17-6.7-33.3-18.7-45.3L512 114.7c-12-12-28.3-18.7-45.3-18.7L416 96l0-48c0-26.5-21.5-48-48-48L112 0zM544 237.3l0 18.7-128 0 0-96 50.7 0L544 237.3zM160 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96zm272 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0z"/>
                                                </svg>
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Suppliers</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        }

                        {hasPermission('Purchase-View') &&
                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item" onClick={() => handleToggleMenu(null)}>
                                        <NavLink to="/purchase" className={`${['purchase','addpurchase','editpurchase'].includes(lastSegment) ? 'active' : ''}`.trim()}>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                                                    <path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
                                                </svg>
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Purchases</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        }


                    </ul>
                </div>
            </nav>
        </div>
    )
}

export default Sidebar;