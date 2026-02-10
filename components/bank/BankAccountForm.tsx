"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Lock, Edit2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DocumentUpload } from "./DocumentUpload"
import {
  bankAccountDetailsSchema,
  bankAccountSubmitSchema,
  type BankAccountDetailsData,
  type BankAccountSubmitData,
} from "@/lib/validations/bank"
import {
  upsertBankAccount,
  submitBankAccountForVerification,
  updateBankProof,
  changeBankAccount,
} from "@/app/actions/bank"

interface BankAccountFormProps {
  bankAccount: {
    id: string
    accountHolderName: string
    bankName: string
    accountNumber: string
    ifscCode: string
    accountType: "SAVINGS" | "CURRENT"
    verificationStatus: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED"
    proofType: "CANCELLED_CHEQUE" | "BANK_STATEMENT" | null
    proofDocumentUrl: string | null
    proofUploadedAt: Date | null
    submittedAt: Date | null
    verifiedAt: Date | null
    rejectedAt: Date | null
    rejectionReason: string | null
  } | null
}

export function BankAccountForm({ bankAccount }: BankAccountFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [editMode, setEditMode] = useState(!bankAccount)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const isVerified = bankAccount?.verificationStatus === "VERIFIED"
  const isPending = bankAccount?.verificationStatus === "PENDING"
  const isRejected = bankAccount?.verificationStatus === "REJECTED"
  const isNotSubmitted = !bankAccount || bankAccount.verificationStatus === "NOT_SUBMITTED"

  // Lock account details if verified
  const canEditDetails = editMode && !isVerified

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BankAccountSubmitData>({
    resolver: zodResolver(bankAccountSubmitSchema),
    defaultValues: bankAccount
      ? {
          accountHolderName: bankAccount.accountHolderName,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          ifscCode: bankAccount.ifscCode,
          accountType: bankAccount.accountType,
          proofType: bankAccount.proofType || undefined,
          proofDocumentUrl: bankAccount.proofDocumentUrl || undefined,
        }
      : {
          accountType: "SAVINGS",
        },
  })

  const proofDocumentUrl = watch("proofDocumentUrl")
  const proofType = watch("proofType")

  const getStatusBadge = () => {
    if (!bankAccount) {
      return (
        <Badge variant="outline" className="bg-muted">
          Not Configured
        </Badge>
      )
    }

    switch (bankAccount.verificationStatus) {
      case "VERIFIED":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="default" className="bg-yellow-600">
            <Clock className="mr-1 h-3 w-3" />
            Pending Verification
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-muted">
            Not Submitted
          </Badge>
        )
    }
  }

  const getStatusMessage = () => {
    if (!bankAccount) {
      return "Configure your bank account to receive payouts."
    }

    switch (bankAccount.verificationStatus) {
      case "VERIFIED":
        return "Your bank account has been verified and is ready for payouts."
      case "PENDING":
        return "Your bank account is under review. We'll notify you once verification is complete."
      case "REJECTED":
        return bankAccount.rejectionReason
          ? `Rejected: ${bankAccount.rejectionReason}`
          : "Your bank account verification was rejected. Please fix the issues and resubmit."
      default:
        return "Save your bank account details and submit for verification."
    }
  }

  const onSaveDraft = async (data: BankAccountDetailsData) => {
    setIsSubmitting(true)
    try {
      const result = await upsertBankAccount(data)
      if (result.success) {
        toast({
          title: "Success",
          description: "Bank account details saved",
        })
        router.refresh()
        setEditMode(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save bank account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save bank account",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmitForVerification = async (data: BankAccountSubmitData) => {
    if (!data.proofType || !data.proofDocumentUrl) {
      toast({
        title: "Error",
        description: "Please upload a proof document before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitBankAccountForVerification(data)
      if (result.success) {
        toast({
          title: "Success",
          description: "Bank account submitted for verification",
        })
        router.refresh()
        setEditMode(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit bank account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit bank account",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onUpdateProof = async () => {
    if (!proofType || !proofDocumentUrl) {
      toast({
        title: "Error",
        description: "Please upload a proof document",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateBankProof({
        proofType,
        proofDocumentUrl,
      })
      if (result.success) {
        toast({
          title: "Success",
          description: "Proof document updated",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update proof",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update proof",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onChangeBankAccount = async () => {
    if (!confirm("Are you sure you want to change your bank account? This will reset verification status.")) {
      return
    }

    setIsChanging(true)
    try {
      const result = await changeBankAccount()
      if (result.success) {
        toast({
          title: "Success",
          description: "Bank account unlocked for editing",
        })
        router.refresh()
        setEditMode(true)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to change bank account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change bank account",
        variant: "destructive",
      })
    } finally {
      setIsChanging(false)
    }
  }

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber
    return "*".repeat(Math.max(0, accountNumber.length - 4)) + accountNumber.slice(-4)
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verification Status</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>{getStatusMessage()}</CardDescription>
        </CardHeader>
        {isRejected && bankAccount?.rejectionReason && (
          <CardContent>
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                <p className="text-sm text-muted-foreground">{bankAccount.rejectionReason}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bank Account Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>
                {isVerified
                  ? "Your verified bank account details (locked)"
                  : "Configure your bank account for payouts"}
              </CardDescription>
            </div>
            {!editMode && !isVerified && (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {isVerified && (
              <Button
                variant="outline"
                size="sm"
                onClick={onChangeBankAccount}
                disabled={isChanging}
              >
                {isChanging ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Bank Account"
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(
              isNotSubmitted || isRejected ? onSubmitForVerification : onSaveDraft
            )}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="accountHolderName" className="text-sm font-medium">
                  Account Holder Name *
                </label>
                {editMode && canEditDetails ? (
                  <>
                    <Input
                      id="accountHolderName"
                      {...register("accountHolderName")}
                      placeholder="Enter account holder name"
                      disabled={!canEditDetails}
                    />
                    {errors.accountHolderName && (
                      <p className="text-xs text-destructive">
                        {errors.accountHolderName.message}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {bankAccount?.accountHolderName || "—"}
                    </p>
                    {isVerified && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="bankName" className="text-sm font-medium">
                  Bank Name *
                </label>
                {editMode && canEditDetails ? (
                  <>
                    <Input
                      id="bankName"
                      {...register("bankName")}
                      placeholder="Enter bank name"
                      disabled={!canEditDetails}
                    />
                    {errors.bankName && (
                      <p className="text-xs text-destructive">{errors.bankName.message}</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {bankAccount?.bankName || "—"}
                    </p>
                    {isVerified && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="accountNumber" className="text-sm font-medium">
                  Account Number *
                </label>
                {editMode && canEditDetails ? (
                  <>
                    <Input
                      id="accountNumber"
                      {...register("accountNumber")}
                      placeholder="Enter account number"
                      disabled={!canEditDetails}
                    />
                    {errors.accountNumber && (
                      <p className="text-xs text-destructive">
                        {errors.accountNumber.message}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {bankAccount ? maskAccountNumber(bankAccount.accountNumber) : "—"}
                    </p>
                    {isVerified && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="ifscCode" className="text-sm font-medium">
                  IFSC Code *
                </label>
                {editMode && canEditDetails ? (
                  <>
                    <Input
                      id="ifscCode"
                      {...register("ifscCode")}
                      placeholder="ABCD0123456"
                      disabled={!canEditDetails}
                      className="uppercase"
                      onChange={(e) => {
                        setValue("ifscCode", e.target.value.toUpperCase())
                      }}
                    />
                    {errors.ifscCode && (
                      <p className="text-xs text-destructive">{errors.ifscCode.message}</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {bankAccount?.ifscCode || "—"}
                    </p>
                    {isVerified && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="accountType" className="text-sm font-medium">
                  Account Type *
                </label>
                {editMode && canEditDetails ? (
                  <>
                    <Select
                      value={watch("accountType")}
                      onValueChange={(value: "SAVINGS" | "CURRENT") => {
                        setValue("accountType", value)
                      }}
                      disabled={!canEditDetails}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAVINGS">Savings</SelectItem>
                        <SelectItem value="CURRENT">Current</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.accountType && (
                      <p className="text-xs text-destructive">{errors.accountType.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {bankAccount?.accountType === "SAVINGS" ? "Savings" : "Current"}
                  </p>
                )}
              </div>
            </div>

            {/* Proof Upload Section */}
            {(isNotSubmitted || isRejected || isPending) && (
              <div className="space-y-2 border-t pt-4">
                <label className="text-sm font-medium">
                  Proof Document * {(isNotSubmitted || isRejected) && "(Required for submission)"}
                </label>
                <p className="text-xs text-muted-foreground">
                  Upload a cancelled cheque or bank statement (PDF, JPG, or PNG, max 5MB)
                </p>

                <div className="space-y-2">
                  <Select
                    value={proofType || ""}
                    onValueChange={(value: "CANCELLED_CHEQUE" | "BANK_STATEMENT") => {
                      setValue("proofType", value)
                    }}
                    disabled={!editMode || isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select proof type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CANCELLED_CHEQUE">Cancelled Cheque</SelectItem>
                      <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.proofType && (
                    <p className="text-xs text-destructive">{errors.proofType.message}</p>
                  )}

                  <DocumentUpload
                    value={proofDocumentUrl || null}
                    onChange={(url) => setValue("proofDocumentUrl", url)}
                    disabled={!editMode || isPending}
                  />
                  {errors.proofDocumentUrl && (
                    <p className="text-xs text-destructive">
                      {errors.proofDocumentUrl.message}
                    </p>
                  )}

                  {bankAccount?.proofDocumentUrl && (
                    <div className="text-xs text-muted-foreground">
                      <a
                        href={bankAccount.proofDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View current proof document
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {editMode && (
              <div className="flex gap-2 pt-4">
                {(isNotSubmitted || isRejected) && (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit for Verification"
                    )}
                  </Button>
                )}
                {isPending && (
                  <Button
                    type="button"
                    onClick={onUpdateProof}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Proof"
                    )}
                  </Button>
                )}
                {!isPending && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSubmit(onSaveDraft)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Draft"
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditMode(false)
                    router.refresh()
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
