import axios from "axios";
// import Swal from "sweetalert2";
// http://192.168.29.83:8000/api/web-login
const api=axios.create({
   //  baseURL:'http://192.168.29.83:8000/api',
    // baseURL:'https://demoapi.spasoftware.online/public/api',
    baseURL:'http://127.0.0.1:8002/api',
    // baseURL:'https://api.nearbydoctors.in/public/api',
     headers: {
        //  "Content-Type": "application/json",
   
        },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token"); // check key name
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
  
    if (error.response?.status == 401) {
  
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_details");

      window.location.href = "/";

    }

    return Promise.reject(error);
  }
);

export const loginWeb= async (payload)=>{
     const response= await api.post('web-login',payload);
     return response;
}

export const fetchProducts = async (page = 1, perPage = 6, search = "") => {
  try {
    const res = await api.get(`/admin/list-product?page=${page}&per_page=${perPage}&search=${search}`);

    if (res.data.status) {
      const paginationData = res.data.data; // 👈 Laravel pagination object
      return {
        status: true,
        products: paginationData.data || [],   // 👈 actual array
        pagination: {
          current_page: paginationData.current_page,
          last_page: paginationData.last_page,
          total: paginationData.total,
        },
      };
    }

    return {
      status: false,
      products: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    };
  } catch (err) {
    console.error("Error fetching services:", err);
    return {
      status: false,
      products: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    };
  }
};

export const addBilling = async (formData) => {
  const res = await api.post("/admin/add-billing", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const advBilling = async (formData) => {
  const res = await api.post("/admin/adv-billing", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const todayBilling = async (formData) => {
  const res = await api.post("/admin/today-billing", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// export const advBilling = async (formData) => {
//   const res = await api.post("/admin/adv-billing", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
//   return res.data;
// };

// membershiphistory

export const membershiphistory = async (phone) => {
  const res = await api.get(
    `/admin/member-transactions?phone=${phone}`,
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;   // returns {status, memberships, ...}
};

export const membershiphistoryAll = async () => {
  const res = await api.get(
    `/admin/member-transactions-all`,
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;   // returns {status, memberships, ...}
};

export const membershiphistorydetails = async (id) => {
  const res = await api.get(
    `/admin/member-transactions-details?membership_id=${id}`,
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;   // returns {status, memberships, ...}
};

export const addProduct = async (formData) => {
  const res = await api.post("/admin/add-product", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateProduct = async (id, formData) => {
  const res = await api.post(`/admin/update-product/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await api.delete(`/admin/delete-product/${id}`);
  return res.data;
};

// Brand Section
export const fetchBrands = async () => {
  const res = await api.get("/admin/list-brand");
  return res.data;
};

export const fetchReports = async (days = 30, branchId = null) => {
  const params = { days };
  if (branchId && branchId !== "all") params.branch_id = branchId;
  const res = await api.get("admin/reports", { params });
  return res.data;
};

// ✅ Flexible version: can pass days OR start/end dates

// authApi.js
export const fetchbranchReports = async (startDate, endDate, branchId = null) => {
  const params = {
    start_date: startDate,
    end_date: endDate,
  };
  if (branchId && branchId !== "all") {
    params.branch_id = branchId;
  }
  const res = await api.get("admin/reportss", { params });
  return res.data;
};

export const fetchBranchesadmin = async () => {
  const res = await api.get("admin/branchess");
  return res.data;
};

export const fetchAppointmentsFull = async (branchId = "all") => {
  const { data } = await api.get(`/appointments-full`, {
    params: { branch_id: branchId }
  });
  // if the backend sends cart as a JSON string, decode it here
  return data.map(a => ({
    ...a,
    cart: typeof a.cart === "string" ? JSON.parse(a.cart) : a.cart
  }));
};

// Categories
export const fetchCategories = async () => {
  const res = await api.get("/admin/list-category");
  return res.data;
};

export const addCategory = async (payload) => {
  const res = await api.post("/admin/add-category", payload);
  return res.data;
};

export const updateCategory = async (id, payload) => {
  const res = await api.post(`/admin/update-category/${id}`, payload);
  return res.data;
};

export const deleteCategory = async (id) => {
  const res = await api.delete(`/admin/delete-category/${id}`);
  return res.data;
};

export const fetchBranches = async (page = 1, perPage = 10, search = "") => {
  try {
    const res = await api.get(
      `/admin/list-branch?page=${page}&per_page=${perPage}&search=${search}`
    );

    if (res.data.status) {
      const paginationData = res.data.data; // Laravel pagination object

      return {
        status: true,
        branches: paginationData.data || [], // 👈 actual array
        pagination: {
          current_page: paginationData.current_page,
          last_page: paginationData.last_page,
          total: paginationData.total,
        },
      };
    }

    return {
      status: false,
      branches: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    };
  } catch (err) {
    console.error("Error fetching branches:", err);
    return {
      status: false,
      branches: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    };
  }
};

export const addBranch = async (payload) => {
  const res = await api.post("/admin/add-branch", payload);
  return res.data;
};

export const updateBranch = async (id, payload) => {
  const res = await api.post(`/admin/update-branch/${id}`, payload);
  return res.data;
};

export const deleteBranch = async (id) => {
  const res = await api.delete(`/admin/delete-branch/${id}`);
  return res.data;
};

export const fetchStaffStats = async (branchId = "all") => {
  // If you want all branches use `all`, otherwise pass a numeric branch id
  const res = await api.get(`/staff-stats?branch_id=${branchId}`);
  return res.data; // backend returns the staff list with status, revenue, etc.
};

export const addbrand= async (payload)=>{
     const response= await api.post('admin/add-brand',payload);
     return response;
}

// Staff Start herw

export const fetchStaff = async (page = 1, perPage = 10, search = "") => {
  try {
    const res = await api.get(
      `/admin/list-staff-only-branch?page=${page}&per_page=${perPage}&search=${search}`
    );

    if (res.data.status) {
      const paginationData = res.data.data; // Laravel pagination object

      return {
        status: true,
        branches: paginationData.data || [], // 👈 actual array
        pagination: {
          current_page: paginationData.current_page,
          last_page: paginationData.last_page,
          total: paginationData.total,
        },
      };
    }

    return {
      status: false,
      branches: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    };
  } catch (err) {
    console.error("Error fetching branches:", err);
    return {
      status: false,
      branches: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    };
  }
};

// export const fetchStaffadmin = async (page = 1, perPage = 10, search = "") => {
//   try {
//     const res = await api.get(
//       `/admin/list-staff?page=${page}&per_page=${perPage}&search=${search}`
//     );

//     if (res.data.status) {
//       const paginationData = res.data.data; // Laravel pagination object

//       return {
//         status: true,
//         branches: paginationData.data || [], // 👈 actual array
//         pagination: {
//           current_page: paginationData.current_page,
//           last_page: paginationData.last_page,
//           total: paginationData.total,
//         },
//       };
//     }

//     return {
//       status: false,
//       branches: [],
//       pagination: { current_page: 1, last_page: 1, total: 0 },
//     };
//   } catch (err) {
//     console.error("Error fetching branches:", err);
//     return {
//       status: false,
//       branches: [],
//       pagination: { current_page: 1, last_page: 1, total: 0 },
//     };
//   }
// };

export const fetchStaffadmin = async (
  page = 1,
  perPage = 10,
  search = "",
  role = ""
) => {
  try {
    const res = await api.get(
      `/admin/list-staff?page=${page}&per_page=${perPage}&search=${encodeURIComponent(
        search
      )}&role=${encodeURIComponent(role)}`
    );

    if (res.data.status) {
      const paginationData = res.data.data; // Laravel pagination object

      return {
        status: true,
        staff: paginationData.data || [], // 👈 changed to staff for clarity
        pagination: {
          current_page: paginationData.current_page,
          last_page: paginationData.last_page,
          total: paginationData.total,
        },
      };
    }

    return {
      status: false,
      staff: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    };
  } catch (err) {
    console.error("Error fetching staff:", err);
    return {
      status: false,
      staff: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    };
  }
};

export const addStaff = async (payload) => {
  const res = await api.post("/admin/add-staff", payload);
  return res.data;
};

export async function staff() {
  const res = await api.get("/admin/staff");
   return res.data;
}

export async function checkVoucher(code) {
  try {
    const res = await api.post("/admin/check-voucher", {
      voucherCode: code,
    
    });
    return res.data;
  } catch (err) {
    console.error("checkVoucher error:", err);
    return { status: false, message: "Server error" };
  }
}

export async function allstaff() {
  const res = await api.get("/admin/allstaff");
   return res.data;
}

export async function advstaff(params = {}) {
  const query = params.date ? `?date=${params.date}` : "";
  const res = await api.get(`/admin/advstaff${query}`);
  return res.data;
}

export async function checkCustomerPhone (phone) {
  const res = await api.get(`/admin/appointments/check-phone/${phone}`);
   return res.data;
}

export const add_staff_branch = async (payload) => {
  const res = await api.post("/admin/add-staff-branch", payload);
  return res.data;
};

export const updateStaff = async (id, payload) => {
  const res = await api.post(`/admin/update-staff/${id}`, payload);
  return res.data;
};

export const deleteStaff = async (id) => {
  const res = await api.delete(`/admin/delete-staff/${id}`);
  return res.data;
};

// membership
 
  export const purchaseMembership = async (payload) => {
  return await api.post("admin/purchase-membership", payload);
};

export const checkMembership = async (phone) => {
  const res = await api.get("admin/membership/check", { params: { phone } });
  return res.data;
};
  
export const fetchMemberships = async (page = 1, perPage = 10, search = "") => {
  try {
    const res = await api.get(
      `/admin/list-membership?page=${page}&per_page=${perPage}&search=${search}`
    );

    if (res.data.status) {
      const paginationData = res.data.data; // Laravel pagination object

      return {
        status: true,
        memberships: paginationData.data || [], // 👈 actual array
      
        pagination: {
          current_page: paginationData.current_page,
          last_page: paginationData.last_page,
          total: paginationData.total,
        },
      };
    }

    return {
      status: false,
      branches: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    };
  } catch (err) {
    console.error("Error fetching branches:", err);
    return {
      status: false,
      branches: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    };
  }
};

export const addMembership = async (payload) => {
  const res = await api.post("/admin/add-membership", payload);
  return res.data;
};

export const updateMembership = async (id, payload) => {
  const res = await api.post(`/admin/update-membership/${id}`, payload);
  return res.data;
};

export const deleteMembership = async (id) => {
  const res = await api.delete(`/admin/delete-membership/${id}`);
  return res.data;
};

/////////////// Old Code

export const addCategorys= async (payload)=>{
     const response= await api.post('admin/add-category',payload);
     return response;
}
export const listCategories = async (id) => {
  const endpoint = id ? `admin/list-category/${id}` : 'admin/list-category';
  const response = await api.get(endpoint);
  return response;
};

export const updateCategorys = async (id, payload) => {
  const response = await api.put(`admin/update-category/${id}`, payload);
  return response.data;
};

export const deleteCategorys = async (id) => {
  const response = await api.delete(`admin/delete-category/${id}`);
  return response;
};

export const addNewGame= async (payload)=>{
     const response= await api.post('admin/add-game',payload);
     return response;
}

export const listGames = async (id) => {
  const endpoint = id ? `admin/list-game/${id}` : 'admin/list-game';
  const response = await api.get(endpoint);
  return response;
};

export const updategames = async (id, payload) => {
  const response = await api.put(`admin/update-game/${id}`, payload);
  return response.data;
};

export const deletegames = async (id) => {
  const response = await api.delete(`admin/delete-game/${id}`);
  return response;
};

// products
export const addNewProduct= async (payload)=>{
     const response= await api.post('admin/add-product',payload);
     return response;
}

export const listProducts = async (id) => {
  const endpoint = id ? `admin/list-product/${id}` : 'admin/list-product';
  const response = await api.get(endpoint);
  return response;
};

export const updateProducts = async (id, payload) => {
  const response = await api.put(`admin/update-product/${id}`, payload);
  return response.data;
};

export const deleteProducts = async (id) => {
  const response = await api.delete(`admin/delete-product/${id}`);
  return response;
};

export const dashboardList = async (id) => {
  const endpoint = id ? `admin/dashboard/${id}` : 'admin/dashboard';
  const response = await api.get(endpoint);
  return response;
};

// dashboard
// order

export const addNewOrder= async (payload)=>{
     const response= await api.post('admin/add-order',payload);
     return response;
}

export const orderList = async (id) => {
  const endpoint = id ? `admin/list-orders/${id}` : 'admin/list-orders';
  const response = await api.get(endpoint);
  return response;
};

export const updateOrderNewStatus = async (id, payload) => {
  const response = await api.put(`admin/update-order/${id}`, payload);
  return response.data;
};

export const customer_store= async (payload)=>{
     const response= await api.post('admin/add-customer',payload);
     return response;
}

export const list_customers= async ()=>{
     const response= await api.get('admin/list-customer');
     return response;
}

export const list_project_by_customer_id=async(id)=>{
    const response= await api.get(`admin/list-project-by-customer-id/${id}`);
     return response;
}

export const delete_customer= async (id)=>{
     const response= await api.delete(`admin/delete-customer/${id}`);
     return response;
}

export const list_customer= async (id)=>{
     const response= await api.get(`admin/list-customer/${id}`);
     return response;
} 

export function customer_update(payload) {

   return api.put(`admin/customer-update/${payload.id}`, payload);
}

export function add_project(payload) {

   return api.post('admin/add-project', payload);
}
export const list_projects= async ()=>{
     const response= await api.get('admin/list-project');
     return response;
}

export const list_project= async (id)=>{
 
     const response= await api.get(`admin/list-project/${id}`);
     return response;
}

export function update_stage(payload) {
   return api.put(`admin/projects-domain-update/${payload.id}`, payload);
}

export function update_hosting_stage(payload) {
   return api.put(`admin/projects-hosting-update/${payload.id}`, payload);
}

export function update_design_stage(payload) {
   return api.put(`admin/projects-design-update/${payload.id}`, payload);
}

export function update_live_stage(payload) {
   return api.put(`admin/projects-live-update/${payload.id}`, payload);
}

export function update_balance_stage(payload) {
   return api.put(`admin/projects-balance-update/${payload.id}`, payload);
}

export function update_stage_update(payload) {
   return api.put(`admin/projects-stage-update/${payload.id}`, payload);
}

export function update_document(payload) {
   return api.post(`admin/project-document`, payload);
}

export const delete_document= async (id)=>{
     const response= await api.delete(`admin/project-document-delete/${id}`);
     return response;
}

export const get_all_salesTeam= async (id)=>{
     const response= await api.get('admin/list-staff');
     return response;
}

export function update_project(formData) {
   return api.post(`admin/project-update`, formData);
}

export function create_staff(payload){
   return api.post('admin/create-staff',payload);
}

export function get_all_staffs(){
   return api.get(`admin/all-staff`);
}

export function get_all_staff(id){
   return api.get(`admin/all-staff/${id}`);
}

export function update_staff(payload){
   return api.post('admin/update-staff',payload);
}

export function delete_staff(payload){
   return api.delete(`admin/delete-staff/${payload}`);
}

export function create_task(payload){
   return api.post('admin/create-task',payload);
}

export function list_all_calender(){
   return api.get('admin/list-all-calender');
}

export function create_meeting(payload){
   return api.post('admin/create-meeting',payload);
}

export function create_invoice(payload){
   return api.post('admin/create-invoice',payload);
}

export function list_invoice(){
   return api.get('admin/list-invoice');
}

export function list_invoice_id(id){
   return api.get(`admin/list-invoice/${id}`);
}

export function list_invoice_ids(id){
   return api.get(`admin/list-invoices/${id}`);
}

export function create_payment(formData) {

  return api.post('admin/create-payment', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function invoices_update(id,payload){
   return api.put(`admin/invoices-update/${id}`,payload);
}

export function create_expanses(payload){
   return api.post('admin/create-expanses',payload);
}

export function list_expanses(){
   return api.get('admin/list-expanses');
}

export function analyticss(){
   return api.get('admin/analytics');
}

export function getOverview(){
   return api.get('admin/getOverview');
}

export function project_status_update(payload){
   return api.post('admin/project-status-update',payload);
}

export function update_expense(id, payload) {
  return api.post(`admin/update-expanses/${id}`, payload);
}

export function delete_expanses(id) {
  return api.delete(`admin/delete-expanses/${id}`);
}

//delete-expanses

// below for chat integration
export function Incomingmessages(){
   return api.get('admin/messages');
}

export const getMessagesBetweenUsers = (userId) =>
  api.get(`admin/messages?user_id=${userId}`);

export function sentMessage(payload){
   return api.post('admin/messages',payload);
}

//Incomingmessages
//   api.get('/messages').then(res => setMessages(res.data));

//project-status-update

//list-expanses

//create-expanses
//invoices-update
//create-invoice
//create-meeting
//list-all-calender
//create-task

//delete-staff

//update-staff
//update_project
// rojects-stage-update

    // Route::put('/projects-hosting-update/{id}',      [ProjectController::class, 'updateHosting']);
    // Route::put('/projects-design-update/{id}',      [ProjectController::class, 'updateDesign']);
    // Route::put('/projects-live-update/{id}',      [ProjectController::class, 'updateMadeLive']);
    // Route::put('/projects-balance-update/{id}',      [ProjectController::class, 'updateBalanceAsked']);

export default api;