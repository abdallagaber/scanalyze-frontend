"use client";

import * as React from "react";
import * as z from "zod";
import { useForm, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EntityDialogProps<T extends z.ZodType> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  schema: T;
  defaultValues?: z.infer<T>;
  onSubmit: (values: z.infer<T>) => void;
  fields: Array<{
    name: Path<z.infer<T>>;
    label: string;
    type?: string;
    placeholder?: string;
    component?: React.ReactElement<{
      value?: string;
      onValueChange?: (value: string) => void;
    }>;
  }>;
  fieldErrors?: { [key: string]: string };
}

export function EntityDialog<T extends z.ZodType>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  fields,
  fieldErrors = {},
}: EntityDialogProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<T>,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues as z.infer<T>);
    }
  }, [open, defaultValues, form]);

  useEffect(() => {
    Object.entries(fieldErrors).forEach(([field, error]) => {
      form.setError(field as any, {
        type: "manual",
        message: error,
      });
    });
  }, [fieldErrors, form]);

  const handleSubmit = (values: z.infer<T>) => {
    form.clearErrors();
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] p-0">
        <div className="px-6 py-4 border-b">
          <DialogHeader className="text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col max-h-[calc(90vh-8rem)]"
          >
            <div className="flex-1 overflow-y-auto px-6 py-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="space-y-4">
                {fields.map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          {field.component ? (
                            React.cloneElement(field.component, {
                              value: formField.value || "",
                              onValueChange: formField.onChange,
                            })
                          ) : (
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              value={formField.value || ""}
                              onChange={formField.onChange}
                              name={formField.name}
                              onBlur={formField.onBlur}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t mt-auto">
              <DialogFooter className="flex justify-end sm:justify-end">
                <Button type="submit">Save</Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
