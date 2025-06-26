import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase credentials
const supabaseUrl = 'https://ssbieircniwbcrsfrcmn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYmllaXJjbml3YmNyc2ZyY21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzY1OTEsImV4cCI6MjA2NjQ1MjU5MX0.WgnmI64SqrWTQDkKYhI_tJqlU8U3PrHGZpiaPmkMReI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions to replace your Python routes
export const SupabaseAPI = {
  // Debug helper to check available tables
  async getAvailableTables() {
    try {
      // Try to query information_schema to get table names
      const { data, error } = await supabase
        .rpc('get_tables')
        .select('*')
      
      if (error) {
        // If RPC doesn't work, try a simple query to test connection
        console.log('RPC not available, testing basic connection...')
        return { message: 'Testing connection...', error: error.message }
      }
      
      return data
    } catch (error) {
      return { message: 'Error checking tables', error: error.message }
    }
  },

  // Workers API (replaces route9.py)
  async getWorkers() {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
    
    if (error) throw error
    return data
  },

  async addWorkers(workersData) {
    const { data, error } = await supabase
      .from('workers')
      .insert(workersData)
      .select()
    
    if (error) throw error
    return data
  },

  async deleteWorker(workerId) {
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', workerId)
    
    if (error) throw error
    return true
  },

  // Orders API (replaces route3.py) - Fixed to handle relationships properly
  async getOrders() {
    try {
      // Get all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false })
      
      if (ordersError) throw ordersError

      // Get all bills
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('*')
      
      if (billsError) throw billsError

      // Get all order-worker associations
      const { data: associations, error: associationsError } = await supabase
        .from('order_worker_association')
        .select('*')
      
      if (associationsError) throw associationsError

      // Get all workers
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('*')
      
      if (workersError) throw workersError

      // Create a map of bills by ID
      const billsMap = {}
      bills.forEach(bill => {
        billsMap[bill.id] = bill
      })

      // Create a map of workers by ID
      const workersMap = {}
      workers.forEach(worker => {
        workersMap[worker.id] = worker
      })

      // Create a map of associations by order ID
      const associationsMap = {}
      associations.forEach(association => {
        if (!associationsMap[association.order_id]) {
          associationsMap[association.order_id] = []
        }
        associationsMap[association.order_id].push(association)
      })

      // Combine the data
      const ordersWithRelations = orders.map(order => {
        const bill = billsMap[order.bill_id]
        const orderAssociations = associationsMap[order.id] || []
        
        const orderWorkerAssociations = orderAssociations.map(association => ({
          order_id: association.order_id,
          worker_id: association.worker_id,
          workers: workersMap[association.worker_id]
        }))

        return {
          ...order,
          bills: bill,
          order_worker_association: orderWorkerAssociations
        }
      })

      return ordersWithRelations
    } catch (error) {
      throw error
    }
  },

  async searchOrders(billNumber) {
    try {
      // Get orders that match the bill number
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .ilike('billnumberinput2', `%${billNumber}%`)
        .order('order_date', { ascending: false })
      
      if (ordersError) throw ordersError

      if (orders.length === 0) return []

      // Get the bill IDs for these orders
      const billIds = [...new Set(orders.map(order => order.bill_id))]

      // Get the order IDs for these orders
      const orderIds = orders.map(order => order.id)

      // Get related bills
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .in('id', billIds)
      
      if (billsError) throw billsError

      // Get related associations
      const { data: associations, error: associationsError } = await supabase
        .from('order_worker_association')
        .select('*')
        .in('order_id', orderIds)
      
      if (associationsError) throw associationsError

      // Get related workers
      const workerIds = [...new Set(associations.map(assoc => assoc.worker_id))]
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .in('id', workerIds)
      
      if (workersError) throw workersError

      // Create maps for efficient lookup
      const billsMap = {}
      bills.forEach(bill => {
        billsMap[bill.id] = bill
      })

      const workersMap = {}
      workers.forEach(worker => {
        workersMap[worker.id] = worker
      })

      const associationsMap = {}
      associations.forEach(association => {
        if (!associationsMap[association.order_id]) {
          associationsMap[association.order_id] = []
        }
        associationsMap[association.order_id].push(association)
      })

      // Combine the data
      const ordersWithRelations = orders.map(order => {
        const bill = billsMap[order.bill_id]
        const orderAssociations = associationsMap[order.id] || []
        
        const orderWorkerAssociations = orderAssociations.map(association => ({
          order_id: association.order_id,
          worker_id: association.worker_id,
          workers: workersMap[association.worker_id]
        }))

        return {
          ...order,
          bills: bill,
          order_worker_association: orderWorkerAssociations
        }
      })

      return ordersWithRelations
    } catch (error) {
      throw error
    }
  },

  // Customer Info API (replaces route2.py)
  async getCustomerInfo(mobileNumber) {
    const { data: measurements, error: measurementsError } = await supabase
      .from('measurements')
      .select('*')
      .eq('phone_number', mobileNumber)
      .single()

    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select(`
        *,
        orders (*)
      `)
      .eq('mobile_number', mobileNumber)

    if (measurementsError && billsError) throw measurementsError

    return {
      measurements: measurements || null,
      order_history: bills?.flatMap(bill => bill.orders) || [],
      customer_name: bills?.[0]?.customer_name,
      mobile_number: mobileNumber
    }
  },

  // Customer Management API (new functions for CustomerInfoScreen)
  async getAllCustomers() {
    try {
      // Try different possible table names
      let data, error;
      
      // First try 'customer_info'
      const result1 = await supabase
        .from('customer_info')
        .select('*')
        .order('name', { ascending: true })
      
      if (!result1.error && result1.data) {
        return result1.data
      }
      
      // Try 'customers'
      const result2 = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })
      
      if (!result2.error && result2.data) {
        return result2.data
      }
      
      // Try 'customer'
      const result3 = await supabase
        .from('customer')
        .select('*')
        .order('name', { ascending: true })
      
      if (!result3.error && result3.data) {
        return result3.data
      }
      
      // Fallback: Get unique customers from bills table
      console.log('No dedicated customer table found, using bills table as fallback')
      const fallbackResult = await supabase
        .from('bills')
        .select('customer_name, mobile_number')
        .not('customer_name', 'is', null)
        .not('mobile_number', 'is', null)
      
      if (!fallbackResult.error && fallbackResult.data) {
        // Convert bills data to customer format
        const uniqueCustomers = fallbackResult.data.reduce((acc, bill) => {
          const existing = acc.find(c => c.phone === bill.mobile_number)
          if (!existing) {
            acc.push({
              id: bill.mobile_number, // Use mobile number as ID
              name: bill.customer_name,
              phone: bill.mobile_number,
              email: '',
              address: '',
              created_at: new Date().toISOString()
            })
          }
          return acc
        }, [])
        
        return uniqueCustomers.sort((a, b) => a.name.localeCompare(b.name))
      }
      
      // If none work, throw the first error
      throw result1.error || result2.error || result3.error || fallbackResult.error || new Error('No customer data found')
      
    } catch (error) {
      throw error
    }
  },

  async addCustomerInfo(customerData) {
    try {
      // Try different possible table names
      let data, error;
      
      // First try 'customer_info'
      const result1 = await supabase
        .from('customer_info')
        .insert(customerData)
        .select()
      
      if (!result1.error && result1.data) {
        return result1.data
      }
      
      // Try 'customers'
      const result2 = await supabase
        .from('customers')
        .insert(customerData)
        .select()
      
      if (!result2.error && result2.data) {
        return result2.data
      }
      
      // Try 'customer'
      const result3 = await supabase
        .from('customer')
        .insert(customerData)
        .select()
      
      if (!result3.error && result3.data) {
        return result3.data
      }
      
      // Fallback: Add to bills table as a placeholder bill
      console.log('No dedicated customer table found, adding to bills table as fallback')
      const fallbackResult = await supabase
        .from('bills')
        .insert({
          customer_name: customerData.name,
          mobile_number: customerData.phone,
          billnumberinput2: `CUST-${Date.now()}`, // Generate a unique bill number
          total_amt: 0,
          payment_amount: 0,
          payment_status: 'pending',
          status: 'pending'
        })
        .select()
      
      if (!fallbackResult.error && fallbackResult.data) {
        // Return in the expected format
        return [{
          id: customerData.phone,
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || '',
          address: customerData.address || '',
          created_at: new Date().toISOString()
        }]
      }
      
      // If none work, throw the first error
      throw result1.error || result2.error || result3.error || fallbackResult.error || new Error('No customer table found')
      
    } catch (error) {
      throw error
    }
  },

  async deleteCustomerInfo(customerId) {
    try {
      // Try different possible table names
      let error;
      
      // First try 'customer_info'
      const result1 = await supabase
        .from('customer_info')
        .delete()
        .eq('id', customerId)
      
      if (!result1.error) {
        return true
      }
      
      // Try 'customers'
      const result2 = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
      
      if (!result2.error) {
        return true
      }
      
      // Try 'customer'
      const result3 = await supabase
        .from('customer')
        .delete()
        .eq('id', customerId)
      
      if (!result3.error) {
        return true
      }
      
      // Fallback: Delete from bills table (if customerId is a phone number)
      console.log('No dedicated customer table found, deleting from bills table as fallback')
      const fallbackResult = await supabase
        .from('bills')
        .delete()
        .eq('mobile_number', customerId)
      
      if (!fallbackResult.error) {
        return true
      }
      
      // If none work, throw the first error
      throw result1.error || result2.error || result3.error || fallbackResult.error || new Error('No customer table found')
      
    } catch (error) {
      throw error
    }
  },

  async updateCustomerMeasurements(mobileNumber, measurementsData) {
    const { data, error } = await supabase
      .from('measurements')
      .update(measurementsData)
      .eq('phone_number', mobileNumber)
      .select()
    
    if (error) throw error
    return data
  },

  // Daily Expenses API (replaces route14.py)
  async getDailyExpenses() {
    const { data, error } = await supabase
      .from('Daily_Expenses')
      .select('*')
      .order('Date', { ascending: false })
    
    if (error) throw error
    return data
  },

  async addDailyExpense(expenseData) {
    const { data, error } = await supabase
      .from('Daily_Expenses')
      .insert(expenseData)
      .select()
    
    if (error) throw error
    return data
  },

  // Worker Expenses API (replaces route17.py)
  async getWorkerExpenses() {
    const { data, error } = await supabase
      .from('Worker_Expense')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data
  },

  async addWorkerExpense(expenseData) {
    const { data, error } = await supabase
      .from('Worker_Expense')
      .insert(expenseData)
      .select()
    
    if (error) throw error
    return data
  },

  // Weekly Pay API (replaces route12.py)
  async getWorkerWeeklyPay() {
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
    
    if (workersError) throw workersError

    const weeklyData = {}
    
    for (const worker of workers) {
      // Get orders for this worker
      const { data: associations } = await supabase
        .from('order_worker_association')
        .select(`
          orders (*)
        `)
        .eq('worker_id', worker.id)

      // Get expenses for this worker
      const { data: expenses } = await supabase
        .from('Worker_Expense')
        .select('*')
        .eq('worker_id', worker.id)

      // Process weekly data (simplified version)
      weeklyData[worker.id] = {
        worker: worker,
        orders: associations?.map(a => a.orders) || [],
        expenses: expenses || [],
        total_work_pay: associations?.reduce((sum, a) => sum + (a.orders?.Work_pay || 0), 0) || 0,
        total_paid: expenses?.reduce((sum, e) => sum + (e.Amt_Paid || 0), 0) || 0
      }
    }

    return weeklyData
  },

  // New Bill API (replaces route1.py)
  async createNewBill(billData) {
    const { data, error } = await supabase
      .from('bills')
      .insert(billData)
      .select()
    
    if (error) throw error
    return data
  },

  // Create Order API (new function for NewBillScreen)
  async createOrder(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
    
    if (error) throw error
    return data
  },

  // Order Status Update API (replaces route4.py)
  async updateOrderStatus(orderId, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
    
    if (error) throw error
    return data
  },

  // Payment Mode Update API (replaces route6.py)
  async updatePaymentMode(orderId, paymentMode) {
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_mode: paymentMode })
      .eq('id', orderId)
      .select()
    
    if (error) throw error
    return data
  },

  // Assign Workers to Order API (replaces route10.py)
  async assignWorkersToOrder(orderId, workerIds) {
    // First, remove existing assignments
    await supabase
      .from('order_worker_association')
      .delete()
      .eq('order_id', orderId)

    // Then add new assignments
    const assignments = workerIds.map(workerId => ({
      order_id: orderId,
      worker_id: workerId
    }))

    const { data, error } = await supabase
      .from('order_worker_association')
      .insert(assignments)
      .select()
    
    if (error) throw error
    return data
  },

  // Daily Profit API (replaces route18.py)
  async calculateProfit(date = null) {
    let ordersQuery = supabase.from('orders').select('*')
    let expensesQuery = supabase.from('Daily_Expenses').select('*')
    let workerExpensesQuery = supabase.from('Worker_Expense').select('*')

    if (date) {
      ordersQuery = ordersQuery.eq('updated_at::date', date)
      expensesQuery = expensesQuery.eq('Date', date)
      workerExpensesQuery = workerExpensesQuery.eq('date', date)
    }

    const [orders, expenses, workerExpenses] = await Promise.all([
      ordersQuery,
      expensesQuery,
      workerExpensesQuery
    ])

    const totalRevenue = orders.data?.filter(o => o.payment_status?.toLowerCase() === 'paid')
      .reduce((sum, o) => sum + (o.total_amt || 0), 0) || 0

    const totalDailyExpenses = expenses.data?.reduce((sum, e) => 
      sum + (e.material_cost || 0) + (e.miscellaneous_Cost || 0) + (e.chai_pani_cost || 0), 0) || 0

    const totalWorkerExpenses = workerExpenses.data?.reduce((sum, e) => 
      sum + (e.Amt_Paid || 0), 0) || 0

    return {
      date: date || 'All Time',
      total_revenue: Math.round(totalRevenue * 100) / 100,
      daily_expenses: Math.round(totalDailyExpenses * 100) / 100,
      worker_expenses: Math.round(totalWorkerExpenses * 100) / 100,
      net_profit: Math.round((totalRevenue - (totalDailyExpenses + totalWorkerExpenses)) * 100) / 100
    }
  }
} 