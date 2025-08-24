import catchAsync from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import FacultyModel from '../models/Faculty';
import TopicModel from '../models/Topic';
import { QueryParamsService } from '../utils/QueryParamsService';
export default class FacultyController {
  public static createFaculty = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    req.body.creatorId = req.user.id;

    if (req.query.select !== undefined)
      req.query.select = QueryParamsService.addFieldsToList(
        req.query,
        'select',
        ['name'],
      );

    const faculty = (await FacultyModel.createOne(
      req.body,
      req.query,
    )) as FacultyModel;
    const topic = await TopicModel.createOne(
      {
        creatorId: req.user.id,
        name: faculty.id.toString(),
        description: `Topic for notifications of ${faculty.name!} faculty.`,
        public: true,
      },
      {},
    );

    res.status(201).json({
      status: 'success',
      data: {
        faculty,
        topic,
      },
    });
  });

  public static getAllFaculties = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const faculties = await FacultyModel.findMany({}, req.query);

    res.status(200).json({
      status: 'success',
      totalCount: faculties.length,
      data: {
        faculties,
      },
    });
  });

  public static getFaculty = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = Number.parseInt(req.params.id);

    const faculty = await FacultyModel.findOneById(id, req.query);

    res.status(200).json({
      status: 'success',
      data: {
        faculty,
      },
    });
  });

  public static updateFaculty = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = Number.parseInt(req.params.id);

    const updatedFaculty = await FacultyModel.updateOne(
      id,
      req.body,
      req.query,
    );

    res.status(200).json({
      status: 'success',
      data: {
        faculty: updatedFaculty,
      },
    });
  });

  public static deleteFaculty = catchAsync(async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const id = Number.parseInt(req.params.id);

    const faculty = await FacultyModel.deleteOne(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}
