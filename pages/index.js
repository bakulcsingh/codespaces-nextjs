import { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { useSession, signIn, signOut } from "next-auth/react";
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
  Paper,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  AttachMoney,
  Category,
  EventNote,
  CheckCircle,
  Cancel,
  Edit,
  Save,
  Cancel as CancelIcon,
} from "@mui/icons-material";

const categories = [
  "Utilities",
  "Credit Card",
  "Rent/Mortgage",
  "Insurance",
  "Phone/Internet",
  "Other",
];

const recurringOptions = [
  { value: "", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const mockSession = {
  user: {
    email: "local@development.com",
    name: "Local Developer",
  },
};

function Home() {
  const { data: session, status } = useSession();
  const [bills, setBills] = useState([]);
  const [newBill, setNewBill] = useState({
    name: "",
    amount: "",
    dueDate: "",
    category: "",
    isPaid: false,
    datePaid: null,
    recurring: "",
    lastGenerated: null,
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  // Load bills from MongoDB
  useEffect(() => {
    const loadBills = async () => {
      try {
        const response = await fetch('/api/bills');
        if (response.ok) {
          const data = await response.json();
          setBills(data);
        }
      } catch (error) {
        console.error('Failed to load bills:', error);
      }
    };
    loadBills();
  }, []);

  useEffect(() => {
    const today = dayjs();
    bills.forEach((bill) => {
      if (!bill.recurring || !bill.lastGenerated) return;

      const dueDate = dayjs(bill.dueDate);
      const lastGenerated = dayjs(bill.lastGenerated);

      let shouldGenerate = false;
      switch (bill.recurring) {
        case "monthly":
          shouldGenerate = today.diff(lastGenerated, "month") >= 1;
          break;
        case "quarterly":
          shouldGenerate = today.diff(lastGenerated, "month") >= 3;
          break;
        case "yearly":
          shouldGenerate = today.diff(lastGenerated, "year") >= 1;
          break;
      }

      if (shouldGenerate) {
        const nextDueDate = dueDate.add(
          bill.recurring === "monthly"
            ? 1
            : bill.recurring === "quarterly"
            ? 3
            : 12,
          "month"
        );

        setBills((prev) => [
          ...prev,
          {
            ...bill,
            id: Date.now(),
            dueDate: nextDueDate.format("YYYY-MM-DD"),
            isPaid: false,
            datePaid: null,
            lastGenerated: today.format("YYYY-MM-DD"),
          },
        ]);
      }
    });
  }, [bills]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const billData = {
      ...newBill,
      id: editingBill || Date.now(),
      dueDate: dayjs(newBill.dueDate).format("YYYY-MM-DD"),
      recurring: isRecurring ? newBill.recurring : "",
      lastGenerated: dayjs().format("YYYY-MM-DD"),
    };

    try {
      const response = await fetch('/api/bills', {
        method: editingBill ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData),
      });

      if (response.ok) {
        if (editingBill) {
          setBills(bills.map(bill => 
            bill.id === editingBill ? billData : bill
          ));
        } else {
          setBills([...bills, billData]);
        }
        setEditingBill(null);
        setNewBill({
          name: "",
          amount: "",
          dueDate: "",
          category: "",
          isPaid: false,
          datePaid: null,
          recurring: "",
          lastGenerated: null,
        });
        setIsRecurring(false);
      }
    } catch (error) {
      console.error('Failed to save bill:', error);
    }
  };

  const handleEdit = (bill) => {
    setEditingBill(bill.id);
    setNewBill({
      ...bill,
      dueDate: dayjs(bill.dueDate),
    });
    setIsRecurring(!!bill.recurring);
  };

  const handleCancelEdit = () => {
    setEditingBill(null);
    setNewBill({
      name: "",
      amount: "",
      dueDate: "",
      category: "",
      isPaid: false,
      datePaid: null,
      recurring: "",
      lastGenerated: null,
    });
    setIsRecurring(false);
  };

  const togglePaidStatus = async (billId) => {
    const bill = bills.find(b => b.id === billId);
    const updatedBill = {
      ...bill,
      isPaid: !bill.isPaid,
      datePaid: !bill.isPaid ? new Date().toISOString().split('T')[0] : null,
    };

    try {
      const response = await fetch('/api/bills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBill),
      });

      if (response.ok) {
        setBills(bills.map(b => b.id === billId ? updatedBill : b));
      }
    } catch (error) {
      console.error('Failed to update bill:', error);
    }
  };

  const sortedBills = [...bills].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );
  const totalUnpaid = bills
    .filter((b) => !b.isPaid)
    .reduce((sum, b) => sum + Number(b.amount), 0);

  if (status === "loading") {
    return <Typography>Loading...</Typography>;
  }

  const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";
  const activeSession = skipAuth ? mockSession : session;

  if (!activeSession) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ my: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Please sign in
          </Typography>
          <Button variant="contained" onClick={() => signIn("github")}>
            Sign in with GitHub
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Typography variant="h3" component="h1">
              Bill Payment Tracker
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2">
                Signed in as {activeSession.user.email}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => skipAuth ? null : signOut()}
                disabled={skipAuth}
              >
                Sign Out
              </Button>
            </Box>
          </Box>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Bill Name"
                  value={newBill.name}
                  onChange={(e) =>
                    setNewBill({ ...newBill, name: e.target.value })
                  }
                  required
                  fullWidth
                />
                <TextField
                  select
                  label="Category"
                  value={newBill.category}
                  onChange={(e) =>
                    setNewBill({ ...newBill, category: e.target.value })
                  }
                  required
                  fullWidth
                >
                  <MenuItem value="">Select Category</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="number"
                  label="Amount"
                  value={newBill.amount}
                  onChange={(e) =>
                    setNewBill({ ...newBill, amount: e.target.value })
                  }
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: <AttachMoney />,
                  }}
                />
                <DatePicker
                  label="Due Date"
                  value={newBill.dueDate ? dayjs(newBill.dueDate) : null}
                  onChange={(date) =>
                    setNewBill({
                      ...newBill,
                      dueDate: date?.format("YYYY-MM-DD") || "",
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} required fullWidth />
                  )}
                  slotProps={{
                    textField: {
                      required: true,
                      fullWidth: true,
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={isRecurring}
                      onChange={(e) => {
                        setIsRecurring(e.target.checked);
                        if (!e.target.checked) {
                          setNewBill((prev) => ({ ...prev, recurring: "" }));
                        }
                      }}
                    />
                  }
                  label="Recurring Bill"
                />
                {isRecurring && (
                  <TextField
                    select
                    label="Recurring Frequency"
                    value={newBill.recurring}
                    onChange={(e) =>
                      setNewBill({ ...newBill, recurring: e.target.value })
                    }
                    required={isRecurring}
                    fullWidth
                  >
                    {recurringOptions
                      .filter((opt) => opt.value !== "")
                      .map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                  </TextField>
                )}
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

          <Paper
            elevation={3}
            sx={{
              p: 3,
              mb: 4,
              bgcolor: "primary.light",
              color: "primary.contrastText",
            }}
          >
            <Typography variant="h5">
              Total Unpaid: ${totalUnpaid.toFixed(2)}
            </Typography>
          </Paper>

          <Stack spacing={2}>
            {sortedBills.map((bill) => (
              <Card
                key={bill.id}
                sx={{
                  bgcolor: bill.isPaid ? "success.light" : "background.paper",
                }}
              >
                <CardContent>
                  {editingBill === bill.id ? (
                    <form onSubmit={handleSubmit}>
                      <Stack spacing={2}>
                        <TextField
                          label="Bill Name"
                          value={newBill.name}
                          onChange={(e) =>
                            setNewBill({ ...newBill, name: e.target.value })
                          }
                          required
                          fullWidth
                        />
                        <TextField
                          select
                          label="Category"
                          value={newBill.category}
                          onChange={(e) =>
                            setNewBill({ ...newBill, category: e.target.value })
                          }
                          required
                          fullWidth
                        >
                          {categories.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          type="number"
                          label="Amount"
                          value={newBill.amount}
                          onChange={(e) =>
                            setNewBill({ ...newBill, amount: e.target.value })
                          }
                          required
                          fullWidth
                        />
                        <DatePicker
                          label="Due Date"
                          value={newBill.dueDate}
                          onChange={(date) =>
                            setNewBill({
                              ...newBill,
                              dueDate: date,
                            })
                          }
                          slotProps={{
                            textField: {
                              required: true,
                              fullWidth: true,
                            },
                          }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isRecurring}
                              onChange={(e) => {
                                setIsRecurring(e.target.checked);
                                if (!e.target.checked) {
                                  setNewBill((prev) => ({
                                    ...prev,
                                    recurring: "",
                                  }));
                                }
                              }}
                            />
                          }
                          label="Recurring Bill"
                        />
                        {isRecurring && (
                          <TextField
                            select
                            label="Recurring Frequency"
                            value={newBill.recurring}
                            onChange={(e) =>
                              setNewBill({
                                ...newBill,
                                recurring: e.target.value,
                              })
                            }
                            required={isRecurring}
                            fullWidth
                          >
                            {recurringOptions
                              .filter((opt) => opt.value !== "")
                              .map((option) => (
                                <MenuItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </MenuItem>
                              ))}
                          </TextField>
                        )}
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            type="submit"
                            variant="contained"
                            startIcon={<Save />}
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outlined"
                            startIcon={<CancelIcon />}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Stack>
                    </form>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="h6">
                          {bill.name}
                          {bill.recurring && (
                            <Chip
                              label={bill.recurring}
                              size="small"
                              color="secondary"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        <Chip
                          icon={<Category />}
                          label={bill.category}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
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
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          onClick={() => handleEdit(bill)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => togglePaidStatus(bill.id)}
                          color={bill.isPaid ? "success" : "primary"}
                        >
                          {bill.isPaid ? <CheckCircle /> : <Cancel />}
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      </Container>
    </LocalizationProvider>
  );
}

export default Home;
