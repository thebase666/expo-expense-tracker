import { db } from "@/firebase";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  "Food & Drinks",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Bills",
  "Income",
  "Other",
];

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [loading, setLoading] = useState(false);
  const transactionsCollection = collection(db, "transactions");

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setSelectedCategory("");
    setIsExpense(true);
  };

  const handleCreate = async () => {
    if (loading) return;

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    const parsedAmount = Number(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Enter valid amount");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Error", "Select category");
      return;
    }

    setLoading(true);

    try {
      const finalAmount = isExpense ? -parsedAmount : parsedAmount;

      await addDoc(transactionsCollection, {
        userId: user.id,
        title: title.trim(),
        amount: finalAmount,
        category: selectedCategory,
        createdAt: serverTimestamp(),
      });

      resetForm();

      Alert.alert("Success", "Transaction created!");
    } catch (error) {
      Alert.alert("Error", "Failed to create transaction");
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>New Transaction</Text>

        {/* Card */}
        <View style={styles.card}>
          {/* Type Switch */}
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentBtn, isExpense && styles.segmentActive]}
              onPress={() => setIsExpense(true)}
            >
              <Text
                style={[
                  styles.segmentText,
                  isExpense && styles.segmentTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, !isExpense && styles.segmentActive]}
              onPress={() => setIsExpense(false)}
            >
              <Text
                style={[
                  styles.segmentText,
                  !isExpense && styles.segmentTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Amount"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={amount}
            onChangeText={(text) => {
              const cleaned = text
                .replace(/[^0-9.]/g, "")
                .replace(/^(\d+)\.(\d{0,2}).*$/, "$1.$2");

              setAmount(cleaned);
            }}
          />

          <TextInput
            style={styles.input}
            placeholder="Transaction Title"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.section}>Category</Text>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save Transaction</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f6ff", // 淡蓝背景
    paddingHorizontal: 20,
  },

  header: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 20,
    color: "#1e3a8a", // 深蓝
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#2563eb",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  /* ===== Segment ===== */

  segment: {
    flexDirection: "row",
    backgroundColor: "#e5edff",
    borderRadius: 12,
    marginBottom: 20,
  },

  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },

  // 默认用蓝色高亮
  segmentActive: {
    backgroundColor: "#2563eb",
  },

  segmentText: {
    fontWeight: "600",
    color: "#1e3a8a",
  },

  segmentTextActive: {
    color: "#ffffff",
  },

  /* ===== Inputs ===== */

  input: {
    backgroundColor: "#f8faff",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },

  section: {
    fontWeight: "600",
    marginBottom: 10,
    color: "#1e3a8a",
  },

  /* ===== Category ===== */

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 10,
  },

  categoryChipActive: {
    backgroundColor: "#2563eb",
  },

  categoryText: {
    fontSize: 13,
    color: "#1e3a8a",
  },

  categoryTextActive: {
    color: "#ffffff",
  },

  /* ===== Save Button ===== */

  saveBtn: {
    backgroundColor: "#2563eb", // 主蓝色
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
