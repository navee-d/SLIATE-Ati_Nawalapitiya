import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ImportResult = {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
};

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: 'Error',
        description: 'Please upload an Excel or CSV file',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get token from localStorage for authentication
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        (headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/admin/import-students', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      const data = await response.json();
      setResult(data);
      toast({
        title: 'Success',
        description: `Imported ${data.success} students successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to import file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Students</h1>
        <p className="text-muted-foreground mt-2">Bulk import student data from Excel or CSV files</p>
      </div>

      <div className="grid gap-6">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Support Excel (.xlsx, .xls) and CSV files. Required columns: Email, Name, StudentNumber, Department, ProgramType, IntakeYear
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              data-testid="drop-zone-students"
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop your file here or click to select</p>
              <p className="text-sm text-muted-foreground mb-4">
                Supported formats: Excel (.xlsx, .xls) and CSV
              </p>
              <label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  disabled={isLoading}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                <Button type="button" variant="outline" disabled={isLoading} asChild>
                  <span>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Select File
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium">Successful</p>
                    <p className="text-2xl font-bold">{result.success}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm font-medium">Failed</p>
                    <p className="text-2xl font-bold">{result.failed}</p>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Errors:</p>
                    <ul className="space-y-1 text-sm">
                      {result.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>
                          Row {err.row}: {err.error}
                        </li>
                      ))}
                      {result.errors.length > 10 && (
                        <li className="text-muted-foreground">
                          ... and {result.errors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Format Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Required Columns:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="font-mono text-primary">Email</span>
                  <span className="text-muted-foreground">Unique email address for the student</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-primary">Name</span>
                  <span className="text-muted-foreground">Full name of the student</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-primary">StudentNumber</span>
                  <span className="text-muted-foreground">Student registration number (4 digits)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-primary">Department</span>
                  <span className="text-muted-foreground">Department code (HNDIT, HNDMG, HNDTHM, HNDE, HNDBF)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-primary">ProgramType</span>
                  <span className="text-muted-foreground">FT (Full-Time) or PT (Part-Time)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-primary">IntakeYear</span>
                  <span className="text-muted-foreground">Year of intake (e.g., 2024)</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Example CSV:</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Email,Name,StudentNumber,Department,ProgramType,IntakeYear
john@sliate.ac.lk,John Doe,0201,HNDIT,FT,2024
jane@sliate.ac.lk,Jane Smith,0202,HNDMG,PT,2024`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
