// Hardcoded users for the prototype — no auth system, per assignment brief.
// username/password are intentionally simple for demo purposes.

export const MANAGER = {
  id: 'mgr-1',
  role: 'manager',
  name: 'Ananya Rao',
  username: 'manager',
  password: 'manager123',
};

const employeeNames = [
  'Arjun Mehta', 'Priya Nair', 'Rohan Gupta', 'Sneha Iyer', 'Karan Malhotra',
  'Divya Reddy', 'Vikram Singh', 'Neha Kapoor', 'Aditya Joshi', 'Ritu Sharma',
  'Sanjay Verma', 'Meera Pillai', 'Rahul Bansal', 'Anjali Desai', 'Varun Chawla',
  'Pooja Menon', 'Amit Trivedi', 'Kavya Rajan', 'Nikhil Bhatt', 'Ishita Sethi',
];

export const EMPLOYEES = employeeNames.map((name, i) => ({
  id: `emp-${i + 1}`,
  role: 'employee',
  name,
  username: name.toLowerCase().split(' ')[0] + (i + 1),
  password: 'employee123',
}));

export const ALL_USERS = [MANAGER, ...EMPLOYEES];

export function findUser(username, password) {
  return ALL_USERS.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );
}
