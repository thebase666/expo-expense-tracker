import { db } from "@/firebase";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ================= TYPES ================= */

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  createdAt: Timestamp;
  userId: string;
}

interface Summary {
  balance: number;
  income: number;
  expenses: number;
}

/* ================= COMPONENT ================= */

export default function Index() {
  const { user } = useUser();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= FETCH DATA ================= */

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.id),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);

      const data: Transaction[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Transaction, "id">),
      }));

      setTransactions(data);
      calculateSummary(data);
    } catch (error) {
      console.log("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [user?.id]);

  const calculateSummary = (data: Transaction[]) => {
    let income = 0;
    let expenses = 0;

    data.forEach((item) => {
      const amount = Number(item.amount) || 0;

      if (amount > 0) income += amount;
      else expenses += amount;
    });

    setSummary({
      income,
      expenses,
      balance: income + expenses,
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingId(id); // ✅ 开始 loading

            await deleteDoc(doc(db, "transactions", id));

            await fetchData();
          } catch (error) {
            console.log("Delete error:", error);
          } finally {
            setDeletingId(null); // ✅ 结束 loading
          }
        },
      },
    ]);
  };

  /* ================= REFRESH ================= */

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 12 }}>Loading transactions...</Text>
      </View>
    );
  }

  /* ================= RENDER ================= */

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Hello,{" "}
          {user?.primaryEmailAddress?.emailAddress?.split("@")[0] ?? "User"}
        </Text>

        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Balance</Text>
          <Text style={styles.balance}>${summary.balance.toFixed(2)}</Text>

          <View style={styles.divider} />

          <View style={styles.stats}>
            <View style={styles.statBox}>
              <Text style={styles.label}>Income</Text>
              <Text style={[styles.amountIncome]}>
                +${summary.income.toFixed(2)}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.label}>Expenses</Text>
              <Text style={[styles.amountExpense]}>
                ${summary.expenses.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions */}
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color="#bbb" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isIncome = item.amount > 0;

            const date =
              item.createdAt instanceof Timestamp
                ? item.createdAt.toDate()
                : new Date();

            return (
              <View style={styles.transaction}>
                <View style={styles.leftSection}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isIncome ? "#e6f7ec" : "#fdeaea" },
                    ]}
                  >
                    <Ionicons
                      name={isIncome ? "arrow-down" : "arrow-up"}
                      size={18}
                      color={isIncome ? "green" : "red"}
                    />
                  </View>

                  <View>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.category}>{item.category}</Text>
                  </View>
                </View>

                <View style={styles.rightSection}>
                  <Text
                    style={[
                      styles.amountText,
                      { color: isIncome ? "green" : "red" },
                    ]}
                  >
                    {isIncome ? "+" : "-"}${Math.abs(item.amount).toFixed(2)}
                  </Text>

                  <Text style={styles.date}>{date.toLocaleDateString()}</Text>
                </View>

                <View style={styles.deleteBtn}>
                  {deletingId === item.id ? (
                    <ActivityIndicator size="small" color="#999" />
                  ) : (
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Ionicons name="trash-outline" size={18} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f2f4f8",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcome: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: "#777",
  },
  balance: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: "#888",
  },
  amountIncome: {
    fontSize: 16,
    fontWeight: "600",
    color: "green",
    marginTop: 4,
  },
  amountExpense: {
    fontSize: 16,
    fontWeight: "600",
    color: "red",
    marginTop: 4,
  },
  transaction: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rightSection: {
    alignItems: "flex-end",
    marginRight: 10,
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
  },
  category: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  amountText: {
    fontWeight: "600",
    fontSize: 15,
  },
  date: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 4,
  },
  deleteBtn: {
    padding: 6,
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    marginTop: 10,
    color: "#999",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
