import { useForm } from "@tanstack/react-form";
import { useEffect, useRef, startTransition } from "react";

import type {
  Destination,
  DestinationType,
} from "@/entities/destination/model/types";
import { safeParseSubmitData } from "@/shared/lib/form";

import { editDestinationSubmitSchema } from "./schema";

export interface EditDestinationFormValues {
  type: DestinationType;
  name: string;
  iataCode: string;
  destinationCode: string;
  latitude: string;
  longitude: string;
  isPreferred: boolean;
}

function getInitialFormValues(
  destination: Destination | null
): EditDestinationFormValues {
  if (!destination) {
    return {
      name: "",
      type: "Country",
      iataCode: "",
      destinationCode: "",
      latitude: "",
      longitude: "",
      isPreferred: false,
    };
  }

  const isAirport = destination.type === "Airport";
  return {
    name: destination.name || "",
    type: destination.type,
    iataCode: isAirport ? destination.code || "" : "",
    destinationCode: !isAirport ? destination.code || "" : "",
    latitude: destination.coordinates?.lat?.toString() || "",
    longitude: destination.coordinates?.lng?.toString() || "",
    isPreferred:
      destination.type === "Country" ? !!destination.isPreferred : false,
  };
}

export function useEditDestinationForm(destination: Destination | null) {
  const prevDestinationIdRef = useRef<string | null>(null);

  const form = useForm({
    defaultValues: getInitialFormValues(destination),
  });

  useEffect(() => {
    const currentId = destination?.id ?? null;
    if (currentId !== prevDestinationIdRef.current) {
      prevDestinationIdRef.current = currentId;
      startTransition(() => {
        form.reset(getInitialFormValues(destination));
      });
    }
  }, [destination?.id, destination, form]);

  const getSubmitData = (id: string, parentId: string | null) => {
    return safeParseSubmitData(editDestinationSubmitSchema, {
      ...form.state.values,
      id,
      parentId,
    });
  };

  return { form, getSubmitData };
}
