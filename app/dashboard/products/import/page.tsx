"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface ImportResult {
  totalRows: number
  validRows: number
  invalidRows: number
  inserted: number
  skipped: number
  errors: Array<{
    rowNumber: number
    data: any
    errors: string[]
    isValid: boolean
  }>
  duplicates: {
    withinFile: Array<{ rowNumber: number; sku: string }>
    inDatabase: Array<{ rowNumber: number; sku: string }>
  }
}

export default function ProductImportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<"all_or_nothing" | "partial_success">("partial_success")
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string[][]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setResult(null)
    setErrors([])

    // Preview first 10 rows
    const text = await selectedFile.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim())
    const previewRows: string[][] = []

    for (let i = 0; i < Math.min(11, lines.length); i++) {
      // Simple CSV parsing for preview
      const row: string[] = []
      let current = ""
      let inQuotes = false

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        if (char === '"') {
          if (inQuotes && lines[i][j + 1] === '"') {
            current += '"'
            j++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === "," && !inQuotes) {
          row.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      row.push(current.trim())
      previewRows.push(row)
    }

    setPreview(previewRows)
  }

  const handleDownloadTemplate = () => {
    window.open("/api/products/import/template", "_blank")
  }

  const handleImport = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("mode", mode)

        const response = await fetch("/api/products/import", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.error) {
            setErrors([data.error])
            if (data.validationResults) {
              setResult({
                totalRows: data.validationResults.length,
                validRows: data.validationResults.filter((r: any) => r.isValid).length,
                invalidRows: data.validationResults.filter((r: any) => !r.isValid).length,
                inserted: 0,
                skipped: 0,
                errors: data.validationResults.filter((r: any) => !r.isValid),
                duplicates: data.duplicates || { withinFile: [], inDatabase: [] },
              })
            }
          } else {
            setErrors([data.error || "Failed to import products"])
          }
          toast({
            title: "Import failed",
            description: data.error || "Failed to import products",
            variant: "destructive",
          })
          return
        }

        if (data.success) {
          setResult(data.result)
          toast({
            title: "Import completed",
            description: data.message,
          })
          // Refresh products page after a delay
          setTimeout(() => {
            router.push("/dashboard/products")
          }, 3000)
        }
      } catch (error: any) {
        console.error("Import error:", error)
        setErrors([error.message || "Failed to import products"])
        toast({
          title: "Import failed",
          description: error.message || "Failed to import products",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Products from CSV</h1>
        <p className="text-muted-foreground">
          Upload a CSV file to bulk import products (up to 1000 rows)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Download the template to see the required format, then upload your CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Maximum 1000 rows. Required columns: name, price. Optional: sku, description, stock,
              mrp, hsnOrSac, gstRate, isTaxable
            </p>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>Preview (first {Math.min(10, preview.length - 1)} rows)</Label>
              <div className="border rounded-md overflow-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {preview[0]?.map((header, idx) => (
                        <TableHead key={idx} className="text-xs">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(1, 11).map((row, rowIdx) => (
                      <TableRow key={rowIdx}>
                        {row.map((cell, cellIdx) => (
                          <TableCell key={cellIdx} className="text-xs">
                            {cell || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Import Mode</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial_success" id="partial" />
                <Label htmlFor="partial" className="font-normal cursor-pointer">
                  Partial Success (import valid rows, skip errors)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all_or_nothing" id="all" />
                <Label htmlFor="all" className="font-normal cursor-pointer">
                  All or Nothing (fail if any row has errors)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || isPending}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isPending ? "Importing..." : "Import Products"}
          </Button>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
            <CardDescription>Summary of the import operation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{result.totalRows}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid Rows</p>
                <p className="text-2xl font-bold text-green-600">{result.validRows}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inserted</p>
                <p className="text-2xl font-bold text-blue-600">{result.inserted}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-orange-600">{result.skipped}</p>
              </div>
            </div>

            {result.duplicates.withinFile.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Duplicates Within File</AlertTitle>
                <AlertDescription>
                  <p className="text-sm mb-2">
                    {result.duplicates.withinFile.length} rows have duplicate SKUs within the file:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {result.duplicates.withinFile.slice(0, 10).map((dup, idx) => (
                      <li key={idx}>
                        Row {dup.rowNumber}: SKU &quot;{dup.sku}&quot;
                      </li>
                    ))}
                    {result.duplicates.withinFile.length > 10 && (
                      <li className="text-muted-foreground">
                        ... and {result.duplicates.withinFile.length - 10} more
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result.duplicates.inDatabase.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Duplicates in Database</AlertTitle>
                <AlertDescription>
                  <p className="text-sm mb-2">
                    {result.duplicates.inDatabase.length} rows have SKUs that already exist:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {result.duplicates.inDatabase.slice(0, 10).map((dup, idx) => (
                      <li key={idx}>
                        Row {dup.rowNumber}: SKU &quot;{dup.sku}&quot;
                      </li>
                    ))}
                    {result.duplicates.inDatabase.length > 10 && (
                      <li className="text-muted-foreground">
                        ... and {result.duplicates.inDatabase.length - 10} more
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Validation Errors ({result.errors.length} rows)</Label>
                <div className="border rounded-md overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.slice(0, 20).map((error, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{error.rowNumber}</TableCell>
                          <TableCell>
                            <ul className="list-disc list-inside space-y-1">
                              {error.errors.map((err, errIdx) => (
                                <li key={errIdx} className="text-sm text-destructive">
                                  {err}
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {result.errors.length > 20 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      ... and {result.errors.length - 20} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.inserted > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Import Successful</AlertTitle>
                <AlertDescription className="text-green-800">
                  Successfully imported {result.inserted} products. Redirecting to products page...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
