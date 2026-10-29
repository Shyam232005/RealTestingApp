import { NextResponse } from "next/server";
import { getAuthenticatedOwner } from "@/lib/ownerAuth";
import connectDB from "@/lib/mongodb";
import JournalEntry from "@/models/JournalEntry";
import Transaction from "@/models/Transaction";
import Organization from "@/models/Organization";
import { ensureChartOfAccounts } from "@/lib/ledgerEngine";

export async function POST(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { organization, owner } = auth;
    await connectDB();
    const accounts = await ensureChartOfAccounts(organization._id, organization);
    const getAcc = (code) => accounts.find((a) => a.code === code);

    const body = await request.json();
    const { entryType } = body;

    if (entryType === "receivable") {
      // Record real Customer Receivable (Trade Debtor)
      const { partyName, phone, invoiceRef, amount, daysOverdue, branchId = "all" } = body;
      const numAmount = Number(amount);
      if (!partyName || !numAmount || numAmount <= 0) {
        return NextResponse.json(
          { error: "Party name and valid amount are required." },
          { status: 400 }
        );
      }

      const debtorAcc = getAcc("1040"); // Accounts Receivable
      const salesAcc = getAcc("4010"); // Sales Revenue

      const overdueDays = Number(daysOverdue) || 0;
      const entryDate = new Date();
      entryDate.setDate(entryDate.getDate() - overdueDays);

      const ref = invoiceRef?.trim() || `INV-${Date.now().toString().slice(-6)}`;

      const journal = new JournalEntry({
        organizationId: organization._id,
        entryNumber: `JE-REC-${Date.now().toString().slice(-6)}`,
        date: entryDate,
        branchId,
        entryType: "SALES",
        reference: ref,
        narration: `Sales Invoice: ${partyName.trim()}`,
        lines: [
          {
            accountId: debtorAcc._id,
            accountCode: debtorAcc.code,
            accountName: debtorAcc.name,
            accountType: debtorAcc.type,
            subCategory: debtorAcc.subCategory,
            debit: numAmount,
            credit: 0,
            description: `Receivable from ${partyName.trim()}`,
          },
          {
            accountId: salesAcc._id,
            accountCode: salesAcc.code,
            accountName: salesAcc.name,
            accountType: salesAcc.type,
            subCategory: salesAcc.subCategory,
            debit: 0,
            credit: numAmount,
            description: `Sales Revenue - Invoice ${ref}`,
          },
        ],
        status: "POSTED",
        createdBy: owner.name || "Owner",
      });
      await journal.save();

      // Upsert into organization branch CRM customers
      const targetBranchId = branchId !== "all" ? branchId : "branch-1";
      const branchIndex = organization.branchList.findIndex(
        (b) => b.branchId === targetBranchId
      );
      if (branchIndex >= 0) {
        const branch = organization.branchList[branchIndex];
        const existingCustIndex = (branch.customers || []).findIndex(
          (c) => c.name.toLowerCase() === partyName.trim().toLowerCase()
        );
        if (existingCustIndex >= 0) {
          branch.customers[existingCustIndex].totalPurchases += numAmount;
          if (phone) branch.customers[existingCustIndex].phone = phone.trim();
          branch.customers[existingCustIndex].lastVisit = new Date();
        } else {
          branch.customers.push({
            name: partyName.trim(),
            phone: phone ? phone.trim() : "+919800000000",
            tier: numAmount >= 100000 ? "VIP" : "Regular",
            totalPurchases: numAmount,
            lastVisit: new Date(),
          });
        }
        await organization.save();
      }

      return NextResponse.json({
        success: true,
        message: "Customer receivable recorded into ledger & CRM successfully.",
      });
    }

    if (entryType === "payable") {
      // Record real Vendor Payable (Trade Creditor)
      const { partyName, phone, billRef, amount, dueInDays, branchId = "all" } = body;
      const numAmount = Number(amount);
      if (!partyName || !numAmount || numAmount <= 0) {
        return NextResponse.json(
          { error: "Supplier name and valid bill amount are required." },
          { status: 400 }
        );
      }

      const creditorAcc = getAcc("2010"); // Accounts Payable
      const purchaseAcc = getAcc("5010"); // Purchases

      const remainingDays = Number(dueInDays) || 15;
      const creditDays = Number(organization.defaultCreditDays) || 30;
      const daysPassed = Math.max(0, creditDays - remainingDays);
      const entryDate = new Date();
      entryDate.setDate(entryDate.getDate() - daysPassed);

      const ref = billRef?.trim() || `BILL-${Date.now().toString().slice(-6)}`;

      const journal = new JournalEntry({
        organizationId: organization._id,
        entryNumber: `JE-PAY-${Date.now().toString().slice(-6)}`,
        date: entryDate,
        branchId,
        entryType: "PURCHASE",
        reference: ref,
        narration: `Vendor Bill: ${partyName.trim()}`,
        lines: [
          {
            accountId: purchaseAcc._id,
            accountCode: purchaseAcc.code,
            accountName: purchaseAcc.name,
            accountType: purchaseAcc.type,
            subCategory: purchaseAcc.subCategory,
            debit: numAmount,
            credit: 0,
            description: `Purchase from ${partyName.trim()}`,
          },
          {
            accountId: creditorAcc._id,
            accountCode: creditorAcc.code,
            accountName: creditorAcc.name,
            accountType: creditorAcc.type,
            subCategory: creditorAcc.subCategory,
            debit: 0,
            credit: numAmount,
            description: `Payable to ${partyName.trim()}`,
          },
        ],
        status: "POSTED",
        createdBy: owner.name || "Owner",
      });
      await journal.save();

      return NextResponse.json({
        success: true,
        message: "Vendor payable recorded into ledger successfully.",
      });
    }

    if (entryType === "product") {
      // Add real Stock Item to Branch Inventory
      const {
        name,
        category = "Finished Goods",
        sellingPrice,
        costPrice,
        quantity = 10,
        branchId = "branch-1",
      } = body;
      const sPrice = Number(sellingPrice);
      const cPrice = Number(costPrice) || Math.round(sPrice * 0.7);
      const qty = Number(quantity) || 0;

      if (!name || sPrice <= 0) {
        return NextResponse.json(
          { error: "Product name and valid selling price are required." },
          { status: 400 }
        );
      }

      const targetBranchId = branchId !== "all" ? branchId : "branch-1";
      const branchIndex = organization.branchList.findIndex(
        (b) => b.branchId === targetBranchId
      );
      if (branchIndex < 0) {
        return NextResponse.json({ error: "Branch not found." }, { status: 404 });
      }

      const branch = organization.branchList[branchIndex];
      const existingItemIndex = (branch.stockItems || []).findIndex(
        (i) => i.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (existingItemIndex >= 0) {
        branch.stockItems[existingItemIndex].unitPrice = sPrice;
        branch.stockItems[existingItemIndex].costPrice = cPrice;
        branch.stockItems[existingItemIndex].quantity += qty;
        branch.stockItems[existingItemIndex].lastUpdated = new Date();
      } else {
        branch.stockItems.push({
          name: name.trim(),
          category: category.trim(),
          unitPrice: sPrice,
          costPrice: cPrice,
          quantity: qty,
          unit: "Pcs",
          stockStatus: "in_stock",
          lastUpdated: new Date(),
        });
      }

      await organization.save();
      return NextResponse.json({
        success: true,
        message: "Product added to inventory successfully.",
      });
    }

    if (entryType === "cash_flow") {
      // Record real Cash Inflow or Outflow
      const {
        title,
        amount,
        type = "CREDIT",
        accountType = "BANK",
        branchId = "all",
      } = body;
      const numAmount = Number(amount);
      if (!title || !numAmount || numAmount <= 0) {
        return NextResponse.json(
          { error: "Title and valid amount are required." },
          { status: 400 }
        );
      }

      await Transaction.create({
        ownerId: owner._id,
        organizationId: organization._id,
        accountType,
        type,
        amount: numAmount,
        title: title.trim(),
        category: type === "CREDIT" ? "Sales / Receipts" : "Operational Expense",
        reference: `TXN-${Date.now().toString().slice(-6)}`,
        status: "COMPLETED",
        branchId,
        date: new Date(),
      });

      // Post Journal Entry to keep ledger balanced
      const bankOrCashAcc = getAcc(accountType === "BANK" ? "1010" : "1020");
      const revOrExpAcc = type === "CREDIT" ? getAcc("4010") : getAcc("6040");

      if (type === "CREDIT") {
        await JournalEntry.create({
          organizationId: organization._id,
          entryNumber: `JE-IN-${Date.now().toString().slice(-6)}`,
          date: new Date(),
          branchId,
          entryType: "RECEIPT",
          reference: `REC-${Date.now().toString().slice(-6)}`,
          narration: `Cash Inflow: ${title.trim()}`,
          lines: [
            {
              accountId: bankOrCashAcc._id,
              accountCode: bankOrCashAcc.code,
              accountName: bankOrCashAcc.name,
              accountType: bankOrCashAcc.type,
              subCategory: bankOrCashAcc.subCategory,
              debit: numAmount,
              credit: 0,
              description: title.trim(),
            },
            {
              accountId: revOrExpAcc._id,
              accountCode: revOrExpAcc.code,
              accountName: revOrExpAcc.name,
              accountType: revOrExpAcc.type,
              subCategory: revOrExpAcc.subCategory,
              debit: 0,
              credit: numAmount,
              description: title.trim(),
            },
          ],
          status: "POSTED",
          createdBy: owner.name || "Owner",
        });
      } else {
        await JournalEntry.create({
          organizationId: organization._id,
          entryNumber: `JE-OUT-${Date.now().toString().slice(-6)}`,
          date: new Date(),
          branchId,
          entryType: "PAYMENT",
          reference: `PAY-${Date.now().toString().slice(-6)}`,
          narration: `Cash Outflow: ${title.trim()}`,
          lines: [
            {
              accountId: revOrExpAcc._id,
              accountCode: revOrExpAcc.code,
              accountName: revOrExpAcc.name,
              accountType: revOrExpAcc.type,
              subCategory: revOrExpAcc.subCategory,
              debit: numAmount,
              credit: 0,
              description: title.trim(),
            },
            {
              accountId: bankOrCashAcc._id,
              accountCode: bankOrCashAcc.code,
              accountName: bankOrCashAcc.name,
              accountType: bankOrCashAcc.type,
              subCategory: bankOrCashAcc.subCategory,
              debit: 0,
              credit: numAmount,
              description: title.trim(),
            },
          ],
          status: "POSTED",
          createdBy: owner.name || "Owner",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Cash flow transaction recorded into ledger successfully.",
      });
    }

    return NextResponse.json(
      { error: "Invalid entry type specified." },
      { status: 400 }
    );
  } catch (err) {
    console.error("POST /api/owner/insights/entry error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
