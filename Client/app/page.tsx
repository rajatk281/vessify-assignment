"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  extractTransaction,
  getTransactions,
  type Transaction,
  type TransactionListResponse,
} from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2,
  LogOut,
  Wallet,
  FileText,
  ArrowDown,
  CheckCircle2,
  Sparkles,
  Calendar,
  DollarSign,
  BarChart3,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "text-emerald-400";
  if (confidence >= 0.5) return "text-yellow-400";
  return "text-red-400";
}

function getConfidenceBadgeVariant(
  confidence: number
): "default" | "secondary" | "destructive" {
  if (confidence >= 0.8) return "default";
  if (confidence >= 0.5) return "secondary";
  return "destructive";
}

// ─── Main Dashboard ──────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionLoading } = useSession();

  const [rawText, setRawText] = useState("");
  const [lastExtracted, setLastExtracted] = useState<Transaction | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ─── Auth redirect ─────────────────────────────────────────────────
  const isAuthenticated = !!session?.user;

  // Redirect to login if not authenticated (after session check completes)
  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isSessionLoading, isAuthenticated, router]);

  // ─── Fetch initial transactions ────────────────────────────────────
  const { isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res: TransactionListResponse = await getTransactions(null, 20);
      setAllTransactions(res.data);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
      return res;
    },
    enabled: isAuthenticated,
  });

  // ─── Load more handler ─────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await getTransactions(nextCursor, 20);
      setAllTransactions((prev) => [...prev, ...res.data]);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch {
      toast.error("Failed to load more transactions.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore]);

  // ─── Extract mutation ──────────────────────────────────────────────
  const extractMutation = useMutation({
    mutationFn: (text: string) => extractTransaction(text),
    onSuccess: (data) => {
      setLastExtracted(data.transaction);
      setRawText("");
      toast.success("Transaction extracted and saved!");
      // Prepend new transaction to the list
      setAllTransactions((prev) => [data.transaction, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      const message =
        error?.response?.data?.error ||
        "Failed to extract transaction. Please try again.";
      toast.error(message);
    },
  });

  const handleExtract = () => {
    if (!rawText.trim()) {
      toast.error("Please enter some bank statement text.");
      return;
    }
    extractMutation.mutate(rawText);
  };

  // ─── Sign out handler ──────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  // ─── Loading / unauthenticated state ───────────────────────────────
  if (isSessionLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 shadow-md shadow-violet-500/15">
              <Wallet className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Vessify</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <p className="text-sm font-medium leading-none">
                  {session.user.name || "User"}
                </p>
                {(session.user as any).role === "admin" && (
                  <Badge variant="default" className="h-4 px-1 text-[9px] uppercase tracking-wider bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border-0">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {session.user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        {/* ── Transaction Extractor Card ────────────────────────────── */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-400" />
              <CardTitle className="text-lg">
                Parse Bank Statement
              </CardTitle>
            </div>
            <CardDescription>
              Paste your raw bank statement text below to extract transaction
              details automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              id="statement-input"
              placeholder={`Paste your bank statement text here...\n\nExample:\n"2024-03-15 Amazon Purchase $49.99"\n"Mar 20, 2024 Starbucks Coffee 5.75"\n"01/04/2024 Electric Bill Payment $120.00"`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={5}
              disabled={extractMutation.isPending}
              className="resize-none font-mono text-sm bg-background/50"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                id="parse-save-btn"
                onClick={handleExtract}
                disabled={extractMutation.isPending || !rawText.trim()}
                className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-700 hover:to-cyan-700 transition-all duration-200 cursor-pointer"
              >
                {extractMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {extractMutation.isPending
                  ? "Parsing…"
                  : "Parse & Save"}
              </Button>

              {lastExtracted && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 animate-in fade-in slide-in-from-left-2 duration-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Saved: {lastExtracted.description} —{" "}
                    {formatCurrency(lastExtracted.amount)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Last Extracted Result Detail ───────────────────────────── */}
        {lastExtracted && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <DollarSign className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(lastExtracted.amount)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-lg font-semibold">
                    {formatDate(lastExtracted.date)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p
                    className={`text-lg font-semibold ${getConfidenceColor(
                      lastExtracted.confidence
                    )}`}
                  >
                    {(lastExtracted.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Transactions Table ─────────────────────────────────────── */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-lg">
                  Your Transactions
                </CardTitle>
              </div>
              {allTransactions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {allTransactions.length} record
                  {allTransactions.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <CardDescription>
              All parsed transactions for your organization, most recent first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isTransactionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  No transactions yet
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/70 max-w-sm">
                  Paste a bank statement in the box above and click &quot;Parse
                  &amp; Save&quot; to extract your first transaction.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Date
                        </TableHead>
                        {(session.user as any).role === "admin" && (
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Owner
                          </TableHead>
                        )}
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Description
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                          Amount
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                          Confidence
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTransactions.map((tx) => (
                        <TableRow
                          key={tx.id}
                          className="border-border/30 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(tx.date)}
                          </TableCell>
                          {(session.user as any).role === "admin" && (
                            <TableCell className="text-sm max-w-[150px] truncate">
                              <span className="text-xs text-muted-foreground">
                                {tx.user?.name || tx.user?.email || "Unknown"}
                              </span>
                            </TableCell>
                          )}
                          <TableCell className="text-sm max-w-[300px] truncate">
                            {tx.description}
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono font-medium whitespace-nowrap">
                            {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={getConfidenceBadgeVariant(tx.confidence)}
                              className="text-xs"
                            >
                              {(tx.confidence * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-6">
                    <Button
                      id="load-more-btn"
                      variant="outline"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="cursor-pointer"
                    >
                      {isLoadingMore ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowDown className="mr-2 h-4 w-4" />
                      )}
                      {isLoadingMore ? "Loading…" : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
