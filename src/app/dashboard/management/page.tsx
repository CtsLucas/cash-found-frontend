
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
import { DataTable } from "@/components/transactions/data-table"
import { categories, tags } from "@/lib/data"
import { categoryColumns } from "@/components/management/categories/columns"
import { tagColumns } from "@/components/management/tags/columns"
import { AddItemSheet } from "@/components/management/add-item-sheet"
  
export default function ManagementPage() {
return (
    <>
        <div className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Management</h1>
        </div>
        <Tabs defaultValue="categories">
            <div className="flex items-center">
            <TabsList>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
                <AddItemSheet />
            </div>
            </div>
            <TabsContent value="categories">
                <DataTable columns={categoryColumns} data={categories} />
            </TabsContent>
            <TabsContent value="tags">
                <DataTable columns={tagColumns} data={tags} />
            </TabsContent>
        </Tabs>
    </>
)
}
