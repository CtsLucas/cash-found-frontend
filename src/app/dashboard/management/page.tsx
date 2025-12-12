
'use client'

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
import { DataTable } from "@/components/transactions/data-table"
import { categoryColumns } from "@/components/management/categories/columns"
import { tagColumns } from "@/components/management/tags/columns"
import { AddItemSheet } from "@/components/management/add-item-sheet"
import { ClientOnly } from "@/components/client-only"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { Category, Tag } from "@/lib/types"
import { collection } from "firebase/firestore"
  
export default function ManagementPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    const categoriesQuery = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `users/${user.uid}/categories`);
    }, [firestore, user]);
    const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

    const tagsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `users/${user.uid}/tags`);
    }, [firestore, user]);
    const { data: tags, isLoading: isLoadingTags } = useCollection<Tag>(tagsQuery);


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
              <ClientOnly>
                {isLoadingCategories ? <p>Loading...</p> : <DataTable columns={categoryColumns} data={categories || []} />}
              </ClientOnly>
            </TabsContent>
            <TabsContent value="tags">
              <ClientOnly>
                {isLoadingTags ? <p>Loading...</p> : <DataTable columns={tagColumns} data={tags || []} />}
              </ClientOnly>
            </TabsContent>
        </Tabs>
    </>
)
}
