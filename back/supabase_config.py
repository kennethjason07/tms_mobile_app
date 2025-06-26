import os
from supabase import create_client, Client
from datetime import datetime, date
from typing import Dict, List, Any, Optional

# Supabase configuration
# Replace these with your actual Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL', 'your-supabase-url')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your-supabase-anon-key')

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class SupabaseHelper:
    """Helper class to handle Supabase operations similar to SQLAlchemy"""
    
    @staticmethod
    def format_date(date_obj):
        """Convert date/datetime objects to ISO format string"""
        if isinstance(date_obj, (date, datetime)):
            return date_obj.isoformat()
        return date_obj
    
    @staticmethod
    def parse_date(date_str):
        """Parse date string to date object"""
        if isinstance(date_str, str):
            return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
        return date_str

    # Generic CRUD operations
    @staticmethod
    def get_all(table_name: str, filters: Dict = None) -> List[Dict]:
        """Get all records from a table with optional filters"""
        query = supabase.table(table_name).select('*')
        
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        response = query.execute()
        return response.data if response.data else []

    @staticmethod
    def get_by_id(table_name: str, record_id: int) -> Optional[Dict]:
        """Get a single record by ID"""
        response = supabase.table(table_name).select('*').eq('id', record_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def create(table_name: str, data: Dict) -> Dict:
        """Create a new record"""
        # Format dates before inserting
        formatted_data = {}
        for key, value in data.items():
            if isinstance(value, (date, datetime)):
                formatted_data[key] = SupabaseHelper.format_date(value)
            else:
                formatted_data[key] = value
        
        response = supabase.table(table_name).insert(formatted_data).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def update(table_name: str, record_id: int, data: Dict) -> Dict:
        """Update a record by ID"""
        # Format dates before updating
        formatted_data = {}
        for key, value in data.items():
            if isinstance(value, (date, datetime)):
                formatted_data[key] = SupabaseHelper.format_date(value)
            else:
                formatted_data[key] = value
        
        response = supabase.table(table_name).update(formatted_data).eq('id', record_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def delete(table_name: str, record_id: int) -> bool:
        """Delete a record by ID"""
        response = supabase.table(table_name).delete().eq('id', record_id).execute()
        return len(response.data) > 0 if response.data else False

    @staticmethod
    def search(table_name: str, column: str, search_term: str) -> List[Dict]:
        """Search records using ILIKE (case-insensitive)"""
        response = supabase.table(table_name).select('*').ilike(column, f'%{search_term}%').execute()
        return response.data if response.data else []

    @staticmethod
    def get_by_date_range(table_name: str, date_column: str, start_date: date, end_date: date) -> List[Dict]:
        """Get records within a date range"""
        response = supabase.table(table_name).select('*').gte(date_column, start_date.isoformat()).lte(date_column, end_date.isoformat()).execute()
        return response.data if response.data else []

    @staticmethod
    def sum_column(table_name: str, column: str, filters: Dict = None) -> float:
        """Sum a column with optional filters"""
        query = supabase.table(table_name).select(column)
        
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        response = query.execute()
        if response.data:
            return sum(item.get(column, 0) or 0 for item in response.data)
        return 0.0

    # Many-to-many relationship helpers
    @staticmethod
    def get_related_records(table_name: str, junction_table: str, foreign_key: str, record_id: int) -> List[Dict]:
        """Get related records through a junction table"""
        response = supabase.table(junction_table).select(f'{table_name}(*)').eq(foreign_key, record_id).execute()
        return response.data if response.data else []

    @staticmethod
    def add_related_records(junction_table: str, data: List[Dict]) -> bool:
        """Add related records to junction table"""
        response = supabase.table(junction_table).insert(data).execute()
        return len(response.data) > 0 if response.data else False

    @staticmethod
    def remove_related_records(junction_table: str, filters: Dict) -> bool:
        """Remove related records from junction table"""
        query = supabase.table(junction_table).delete()
        for key, value in filters.items():
            query = query.eq(key, value)
        response = query.execute()
        return len(response.data) > 0 if response.data else False

# Convenience functions for common operations
def get_workers():
    """Get all workers"""
    return SupabaseHelper.get_all('workers')

def get_orders():
    """Get all orders with related data"""
    return SupabaseHelper.get_all('orders')

def get_bills():
    """Get all bills"""
    return SupabaseHelper.get_all('bills')

def get_worker_expenses():
    """Get all worker expenses"""
    return SupabaseHelper.get_all('Worker_Expense')

def get_daily_expenses():
    """Get all daily expenses"""
    return SupabaseHelper.get_all('Daily_Expenses')

def get_measurements():
    """Get all measurements"""
    return SupabaseHelper.get_all('measurements') 