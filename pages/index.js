import { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Paper
} from '@mui/material'
import {
  AttachMoney,
  Category,
  EventNote,
  CheckCircle,
  Cancel
} from '@mui/icons-material'

function Home() {
  const categories = [
    'Utilities',
    'Credit Card',
    'Rent/Mortgage',
    'Insurance',
    'Phone/Internet',
    'Other'
  ]

  const [bills, setBills] = useState([])
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDate: '',
    category: '',
    isPaid: false,
    datePaid: null
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setBills([...bills, {
      ...newBill,
      id: Date.now()
    }])
    setNewBill({ name: '', amount: '', dueDate: '', category: '', isPaid: false, datePaid: null })
  }

  const togglePaidStatus = (billId) => {
    setBills(bills.map(bill => 
      bill.id === billId ? {
        ...bill,
        isPaid: !bill.isPaid,
        datePaid: !bill.isPaid ? new Date().toISOString().split('T')[0] : null
      } : bill
    ))
  }

  const sortedBills = [...bills].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const totalUnpaid = bills.filter(b => !b.isPaid).reduce((sum, b) => sum + Number(b.amount), 0)

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Bill Payment Tracker
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Bill Name"
                value={newBill.name}
                onChange={(e) => setNewBill({...newBill, name: e.target.value})}
                required
                fullWidth
              />
              <TextField
                select
                label="Category"
                value={newBill.category}
                onChange={(e) => setNewBill({...newBill, category: e.target.value})}
                required
                fullWidth
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>
              <TextField
                type="number"
                label="Amount"
                value={newBill.amount}
                onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                required
                fullWidth
                InputProps={{
                  startAdornment: <AttachMoney />
                }}
              />
              <TextField
                type="date"
                label="Due Date"
                value={newBill.dueDate}
                onChange={(e) => setNewBill({...newBill, dueDate: e.target.value})}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<EventNote />}
              >
                Add Bill
              </Button>
            </Stack>
          </form>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="h5">
            Total Unpaid: ${totalUnpaid.toFixed(2)}
          </Typography>
        </Paper>

        <Stack spacing={2}>
          {sortedBills.map(bill => (
            <Card key={bill.id} sx={{ bgcolor: bill.isPaid ? 'success.light' : 'background.paper' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{bill.name}</Typography>
                    <Chip
                      icon={<Category />}
                      label={bill.category}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="primary">
                      ${Number(bill.amount).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due: {new Date(bill.dueDate).toLocaleDateString()}
                    </Typography>
                    {bill.datePaid && (
                      <Typography variant="body2" color="success.main">
                        Paid: {new Date(bill.datePaid).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    onClick={() => togglePaidStatus(bill.id)}
                    color={bill.isPaid ? "success" : "primary"}
                    sx={{ ml: 2 }}
                  >
                    {bill.isPaid ? <CheckCircle /> : <Cancel />}
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Container>
  )
}

export default Home
