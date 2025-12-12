
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
import { useState } from "react"
import { DataTableSkeleton } from "@/components/transactions/data-table-skeleton"
import { EmptyState } from "@/components/empty-state"
import { PlusCircle } from "lucide-react"
import { useLanguage } from "@/components/i18n/language-provider"
  
export default function ManagementPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { t } = useLanguage();
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
    const [isTagSheetOpen, setIsTagSheetOpen] = useState(false);

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
    
    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setIsCategorySheetOpen(true);
    }
    
    const handleEditTag = (tag: Tag) => {
        setEditingTag(tag);
        setIsTagSheetOpen(true);
    }

    const handleCategorySheetOpenChange = (isOpen: boolean) => {
        setIsCategorySheetOpen(isOpen);
        if (!isOpen) {
            setEditingCategory(null);
        }
    }

    const handleTagSheetOpenChange = (isOpen: boolean) => {
        setIsTagSheetOpen(isOpen);
        if (!isOpen) {
            setEditingTag(null);
        }
    }


return (
    <>
        <div className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight font-headline">{t('management.title')}</h1>
        </div>
        <Tabs defaultValue="categories">
            <div className="flex items-center">
            <TabsList>
                <TabsTrigger value="categories">{t('categories')}</TabsTrigger>
                <TabsTrigger value="tags">{t('tags')}</TabsTrigger>
            </TabsList>
            </div>
            <TabsContent value="categories">
              <ClientOnly>
                <div className="flex justify-end py-2">
                    <AddItemSheet 
                        itemType="Category"
                        isOpen={isCategorySheetOpen}
                        onOpenChange={handleCategorySheetOpenChange}
                        editingItem={editingCategory}
                    />
                </div>
                {isLoadingCategories ? <DataTableSkeleton columnCount={3} /> : (
                    (categories && categories.length > 0) ? (
                        <DataTable columns={categoryColumns(handleEditCategory, t)} data={categories} />
                    ) : (
                        <EmptyState
                            icon={PlusCircle}
                            title={t('management.categories.empty.title')}
                            description={t('management.categories.empty.description')}
                        >
                            <AddItemSheet 
                                itemType="Category"
                                isOpen={isCategorySheetOpen}
                                onOpenChange={handleCategorySheetOpenChange}
                                editingItem={editingCategory}
                            />
                        </EmptyState>
                    )
                )}
              </ClientOnly>
            </TabsContent>
            <TabsContent value="tags">
              <ClientOnly>
                <div className="flex justify-end py-2">
                    <AddItemSheet 
                        itemType="Tag"
                        isOpen={isTagSheetOpen}
                        onOpenChange={handleTagSheetOpenChange}
                        editingItem={editingTag}
                    />
                </div>
                {isLoadingTags ? <DataTableSkeleton columnCount={3} /> : (
                    (tags && tags.length > 0) ? (
                        <DataTable columns={tagColumns(handleEditTag, t)} data={tags} />
                    ) : (
                        <EmptyState
                            icon={PlusCircle}
                            title={t('management.tags.empty.title')}
                            description={t('management.tags.empty.description')}
                        >
                            <AddItemSheet
                                itemType="Tag"
                                isOpen={isTagSheetOpen}
                                onOpenChange={handleTagSheetOpenChange}
                                editingItem={editingTag}
                            />
                        </EmptyState>
                    )
                )}
              </ClientOnly>
            </TabsContent>
        </Tabs>
    </>
)
}
